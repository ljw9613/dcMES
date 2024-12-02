<template>
    <el-select
      v-model="selectedExperts"
      multiple
      filterable
      remote
      reserve-keyword
      placeholder="请输入达人昵称搜索"
      :remote-method="remoteSearch"
      :loading="loading"
      clearable
      collapse-tags
      @change="handleChange"
    >
      <el-option
        v-for="expert in experts"
        :key="expert._id"
        :label="expert.nickname"
        :value="expert._id"
      >
        <div class="expert-option">
          <span>{{ expert.nickname }}</span>
          <small class="platform-info">
            {{ expert.platform }} | {{ expert.mainCategory }}
          </small>
        </div>
      </el-option>
    </el-select>
  </template>
  
  <script>
  import { getData } from '@/api/data'
  
  export default {
    name: 'ExpertSelect',
    props: {
      value: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return {
        loading: false,
        experts: [],
        selectedExperts: this.value
      }
    },
    watch: {
      value: {
        handler(newVal) {
          this.selectedExperts = newVal
          if (newVal && newVal.length && !this.experts.length) {
            this.fetchExpertsByIds(newVal)
          }
        },
        immediate: true
      }
    },
    methods: {
      // 远程搜索
      async remoteSearch(query) {
        if (query !== '') {
          this.loading = true
          try {
            const result = await getData('expert', {
              query: JSON.stringify({
                nickname: { $regex: query, $options: 'i' }
              }),
              limit: 20
            })
            // 保留已选中的专家
            const selectedExperts = this.experts.filter(expert => 
              this.selectedExperts.includes(expert._id)
            )
            // 合并搜索结果和已选中的专家，去重
            this.experts = [...new Map(
              [...selectedExperts, ...result.data].map(item => [item._id, item])
            ).values()]
          } catch (error) {
            console.error('搜索达人失败:', error)
            this.$message.error('搜索达人失败')
          }
          this.loading = false
        }
      },
  
      // 当选择改变时触发
      handleChange(value) {
        this.$emit('input', value)
        const selectedExperts = this.experts.filter(expert => value.includes(expert._id))
        this.$emit('select', selectedExperts)
      },
  
      // 根据ID列表获取达人信息
      async fetchExpertsByIds(ids) {
        if (!ids.length) return
        
        try {
          const result = await getData('expert', {
            query: JSON.stringify({ 
              _id: { $in: ids }
            })
          })
          if (result.data && result.data.length > 0) {
            // 保留现有专家列表中不在新获取数据中的项
            const existingExperts = this.experts.filter(
              expert => !result.data.find(e => e._id === expert._id)
            )
            this.experts = [...existingExperts, ...result.data]
          }
        } catch (error) {
          console.error('获取达人信息失败:', error)
        }
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .expert-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .platform-info {
      color: #909399;
      font-size: 12px;
    }
  }
  </style>