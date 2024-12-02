<template>
  <el-select v-model="selectedTasks" 
    multiple 
    filterable 
    remote 
    reserve-keyword 
    placeholder="请输入任务标题搜索" 
    :remote-method="remoteSearch"
    :loading="loading"
    @change="handleChange">
    <el-option
      v-for="item in options"
      :key="item._id"
      :label="item.title"
      :value="item._id">
      <span style="float: left">{{ item.title }}</span>
      <span style="float: right; color: #8492a6; font-size: 13px">
        {{ item.type }}
      </span>
    </el-option>
  </el-select>
</template>

<script>
import { getData } from '@/api/data'

export default {
  name: 'TaskSelect',
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loading: false,
      options: [],
      selectedTasks: []
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.selectedTasks = val
        if (val && val.length > 0) {
          this.fetchSelectedTasks(val)
        }
      }
    }
  },
  methods: {
    async remoteSearch(query) {
      if (query !== '') {
        this.loading = true
        try {
          const result = await getData('task', {
            query: {
              title: { $regex: query, $options: 'i' }
            },
            limit: 20
          })
          this.options = result.data
        } catch (error) {
          console.error('搜索任务失败:', error)
          this.$message.error('搜索任务失败')
        } finally {
          this.loading = false
        }
      } else {
        this.options = []
      }
    },
    async fetchSelectedTasks(ids) {
      if (!ids || ids.length === 0) return
      
      try {
        const result = await getData('task', {
          query: {
            _id: { $in: ids }
          }
        })
        this.options = result.data
      } catch (error) {
        console.error('获取已选任务失败:', error)
      }
    },
    handleChange(value) {
      this.$emit('input', value)
    }
  }
}
</script>