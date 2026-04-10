<template>
  <el-select v-model="selectedItems" filterable remote reserve-keyword :disabled="disabled" :placeholder="placeholder"
    :remote-method="handleRemoteSearch" :loading="loading" :clearable="clearable" :multiple="multiple"
    :collapse-tags="collapseTags" @change="handleChange">

    <!-- 字符数不足时的提示项，不可选 -->
    <el-option v-if="showMinCharsHint" :value="null" :disabled="true" class="hint-option">
      <span class="hint-text">
        <i class="el-icon-info" /> 请输入至少 {{ minSearchLength }} 个字符开始搜索
      </span>
    </el-option>

    <el-option v-for="item in items" :key="item[valueKey]" :label="getItemLabel(item)" :value="item[valueKey]">
      <slot name="option" :item="item">
        <div class="item-option">
          <div class="item-info">
            <span class="name">{{ item[labelKey] }}</span>
            <template v-if="tagKey">
              <el-tag size="mini" type="info">{{ item[tagKey] }}</el-tag>
            </template>
          </div>
          <div class="sub-info" v-if="subKey && item[subKey]">
            <small>{{ item[subKey] }}</small>
          </div>
        </div>
      </slot>
    </el-option>

    <el-option v-if="hasMore" class="load-more-option" :value="null" :disabled="true">
      <div class="load-more" @click.stop="loadMore">
        点击加载更多 (已显示 {{items.length}}/{{total}} 条)
      </div>
    </el-option>
  </el-select>
</template>

<script>
import { getData } from '@/api/data'

export default {
  name: 'ZrSelect',
  props: {
    // 数据相关配置
    value: {
      type: [Array, String, Number],
      default: () => []
    },
    collection: { // 集合/表名
      type: String,
      required: true
    },
    searchFields: { // 需要模糊查询的字段
      type: Array,
      default: () => ['name']
    },
    additionalQuery: { // 附加的查询条件
      type: Object,
      default: () => ({})
    },

    disabled: {
      type: Boolean,
      default: false
    },

    // 显示相关配置
    valueKey: { // 值字段
      type: String,
      default: '_id'
    },
    labelKey: { // 主要显示字段
      type: String,
      default: 'name'
    },
    tagKey: { // 标签字段
      type: String,
      default: ''
    },
    subKey: { // 副标题字段
      type: String,
      default: ''
    },

    // 选择器配置
    multiple: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: true
    },
    collapseTags: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      default: '请输入关键词搜索'
    },
    limit: {
      type: Number,
      default: 20
    },
    lazyLoad: {
      type: Boolean,
      default: false
    },

    /**
     * 触发搜索所需的最少字符数。
     * 设为 0 表示不限制（与旧行为一致）；设为 2 以上可显著减少不必要的请求，
     * 对 k3_BD_MATERIAL 等大集合尤其重要，避免 1 个字符触发全表扫描。
     */
    minSearchLength: {
      type: Number,
      default: 0
    },

    /**
     * 防抖延迟（毫秒）。用户停止输入 debounceTime 毫秒后才真正发起请求，
     * 防止逐字符触发大量并发查询拖垮服务端。
     */
    debounceTime: {
      type: Number,
      default: 400
    },

    // 新增 queryParams 属性
    queryParams: {
      type: Object,
      default: () => ({
        query: {}
      })
    }
  },

  data() {
    return {
      loading: false,
      items: [],
      selectedItems: this.multiple ? (Array.isArray(this.value) ? this.value : []) : this.value,
      total: 0,
      offset: 0,
      currentQuery: '',
      searchTimer: null,    // 防抖计时器
      showMinCharsHint: false // 是否显示"请输入更多字符"提示
    }
  },

  computed: {
    hasMore() {
      return this.items.length < this.total
    }
  },

  watch: {
    value: {
      handler(newVal) {
        this.selectedItems = this.multiple ? (Array.isArray(newVal) ? newVal : []) : newVal
        if (newVal && (this.multiple ? newVal.length : newVal) && !this.items.length) {
          this.fetchItemsByIds(this.multiple ? newVal : [newVal])
        }
      },
      immediate: true
    }
  },

  created() {
    // minSearchLength > 0 时不做初始加载，等用户输入足够字符后再查询
    const skipInitialLoad = this.lazyLoad || this.minSearchLength > 0
    if (!skipInitialLoad) {
      this.remoteSearch('')
    }
  },

  beforeDestroy() {
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },

  methods: {
    getItemLabel(item) {
      const label = item[this.labelKey]
      const sub = this.subKey ? item[this.subKey] : ''
      return sub ? `${label} - ${sub}` : label
    },

    /**
     * el-select 的 remote-method 回调入口。
     * 在这里做防抖 + 最小字符数拦截，不直接发请求。
     */
    handleRemoteSearch(query) {
      if (this.searchTimer) clearTimeout(this.searchTimer)

      // 字符数不足：清空列表、显示提示、不发请求
      if (this.minSearchLength > 0 && query.length > 0 && query.length < this.minSearchLength) {
        this.showMinCharsHint = true
        this.items = []
        this.total = 0
        return
      }

      this.showMinCharsHint = false

      // lazyLoad 模式下空字符串不加载
      if (this.lazyLoad && !query) return

      // 防抖：停止输入 debounceTime 毫秒后才真正查询
      this.searchTimer = setTimeout(() => {
        this.remoteSearch(query)
      }, query ? this.debounceTime : 0)
    },

    // 真正执行远程搜索（由防抖触发）
    async remoteSearch(query) {
      this.offset = 0
      this.currentQuery = query
      await this.fetchData(query)
    },

    // 新增加载更多方法
    async loadMore() {
      this.offset += this.limit
      await this.fetchData(this.currentQuery, true)
    },

    // 抽取通用的数据获取方法
    async fetchData(query, append = false) {
      this.loading = true
      try {
        const searchConditions = query ? this.searchFields.map(field => ({
          [field]: { $regex: query, $options: 'i' }
        })) : []

        const queryConditions = []
        if (searchConditions.length > 0) {
          queryConditions.push({ $or: searchConditions })
        }
        if (Object.keys(this.additionalQuery).length > 0) {
          queryConditions.push(this.additionalQuery)
        }
        // 添加 queryParams 中的查询条件
        if (this.queryParams.query && Object.keys(this.queryParams.query).length > 0) {
          queryConditions.push(this.queryParams.query)
        }

        const result = await getData(this.collection, {
          query: JSON.stringify(
            queryConditions.length > 0 ? { $and: queryConditions } : {}
          ),
          count: true,
          limit: this.limit,
          skip: this.offset
        })

        this.total = result.countnum || 0
        this.items = append ? [...this.items, ...result.data] : result.data
      } catch (error) {
        console.error('搜索失败:', error)
        this.$message.error('搜索失败')
      }
      this.loading = false
    },

    handleChange(value) {
      this.$emit('input', value)
      const selectedItems = this.items.filter(item =>
        this.multiple
          ? value.includes(item[this.valueKey])
          : value === item[this.valueKey]
      )
      this.$emit('select', this.multiple ? selectedItems : selectedItems[0])
    },

    async fetchItemsByIds(ids) {
      if (!ids.length) return

      try {
        const queryConditions = {
          [this.valueKey]: { $in: ids },
          ...this.additionalQuery
        }
        
        // 合并 queryParams 中的查询条件
        if (this.queryParams.query && Object.keys(this.queryParams.query).length > 0) {
          queryConditions.$and = [
            queryConditions,
            this.queryParams.query
          ]
        }

        const result = await getData(this.collection, {
          query: JSON.stringify(queryConditions)
        })
        
        if (result.data && result.data.length > 0) {
          const existingItems = this.items.filter(
            item => !result.data.find(i => i[this.valueKey] === item[this.valueKey])
          )
          this.items = [...existingItems, ...result.data]
        }
      } catch (error) {
        console.error('获取数据失败:', error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.hint-option {
  cursor: default;
  .hint-text {
    color: #909399;
    font-size: 13px;
    i { margin-right: 4px; }
  }
}

.item-option {
  padding: 5px 0;

  .item-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .name {
      font-weight: 500;
    }
  }

  .sub-info {
    margin-top: 4px;
    color: #909399;
    font-size: 12px;
  }
}

.load-more-option {
  .load-more {
    text-align: center;
    padding: 5px 0;
    color: #409EFF;
    cursor: pointer;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>