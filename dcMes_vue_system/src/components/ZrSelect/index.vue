<template>
  <el-select v-model="selectedItems" filterable remote reserve-keyword :disabled="disabled" :placeholder="placeholder"
    :remote-method="remoteSearch" :loading="loading" :clearable="clearable" :multiple="multiple"
    :collapse-tags="collapseTags" @change="handleChange">
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
    }
  },

  data() {
    return {
      loading: false,
      items: [],
      selectedItems: this.multiple ? (Array.isArray(this.value) ? this.value : []) : this.value,
      total: 0,
      offset: 0,
      currentQuery: ''
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
        console.log('值变化:', newVal)
        this.selectedItems = this.multiple ? (Array.isArray(newVal) ? newVal : []) : newVal
        if (newVal && (this.multiple ? newVal.length : newVal) && !this.items.length) {
          this.fetchItemsByIds(this.multiple ? newVal : [newVal])
        }
      },
      immediate: true
    }
  },

  created() {
    console.log('初始值:', this.value)
    if (!this.lazyLoad) {
      this.remoteSearch('')
    }
  },

  methods: {
    getItemLabel(item) {
      const label = item[this.labelKey]
      const sub = this.subKey ? item[this.subKey] : ''
      return sub ? `${label} - ${sub}` : label
    },

    // 远程搜索
    async remoteSearch(query) {
      if (this.lazyLoad && !query) {
        return
      }

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

        const result = await getData(this.collection, {
          query: JSON.stringify(
            queryConditions.length > 0 ? { $and: queryConditions } : {}
          ),
          count: true,
          limit: this.limit,
          skip: this.offset
        })

        this.total = result.countnum || 0
        // 根据是否追加来更新列表
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
      console.log('查询ID:', ids)
      if (!ids.length) return

      try {
        const result = await getData(this.collection, {
          query: JSON.stringify({
            [this.valueKey]: { $in: ids },
            ...this.additionalQuery
          })
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