<template>
    <el-select
      v-model="selectedAgents"
      filterable
      remote
      reserve-keyword
      placeholder="请输入经纪人名称搜索"
      :remote-method="remoteSearch"
      :loading="loading"
      clearable
      collapse-tags
      @change="handleChange"
    >
      <el-option
        v-for="agent in agents"
        :key="agent._id"
        :label="getAgentLabel(agent)"
        :value="agent._id"
      >
        <div class="agent-option">
          <div class="agent-info">
            <span class="name">{{ agent.nickName }}</span>
            <el-tag size="mini" type="info">{{ agent.phone }}</el-tag>
          </div>
          <div class="company-info" v-if="agent.company">
            <small>{{ agent.company }}</small>
          </div>
        </div>
      </el-option>
    </el-select>
  </template>
  
  <script>
  import { getData } from '@/api/data'
  
  export default {
    name: 'AgentSelect',
    props: {
      value: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return {
        loading: false,
        agents: [],
        selectedAgents: this.value
      }
    },
    watch: {
      value: {
        handler(newVal) {
          this.selectedAgents = newVal
          if (newVal && newVal.length && !this.agents.length) {
            this.fetchAgentsByIds(newVal)
          }
        },
        immediate: true
      }
    },
    methods: {
      // 获取经纪人显示标签
      getAgentLabel(agent) {
        return `${agent.nickName}${agent.company ? ` - ${agent.company}` : ''}`
      },
  
      // 远程搜索
      async remoteSearch(query) {
        if (query !== '') {
          this.loading = true
          try {
            const result = await getData('user_login', {
              query: JSON.stringify({
                $or: [
                  { nickName: { $regex: query, $options: 'i' } },
                  { phone: { $regex: query, $options: 'i' } }
                ],
                roles: { $elemMatch: { label: 'Agent' } }
              }),
              limit: 20
            })
            // 保留已选中的经纪人
            const selectedAgents = this.agents.filter(agent => 
              this.selectedAgents.includes(agent._id)
            )
            // 合并搜索结果和已选中的经纪人，去重
            this.agents = [...new Map(
              [...selectedAgents, ...result.data].map(item => [item._id, item])
            ).values()]
          } catch (error) {
            console.error('搜索经纪人失败:', error)
            this.$message.error('搜索经纪人失败')
          }
          this.loading = false
        }
      },
  
      // 当选择改变时触发
      handleChange(value) {
        this.$emit('input', value)
        const selectedAgents = this.agents.filter(agent => value.includes(agent._id))
        this.$emit('select', selectedAgents)
      },
  
      // 根据ID列表获取经纪人信息
      async fetchAgentsByIds(ids) {
        if (!ids.length) return
        
        try {
          const result = await getData('user_login', {
            query: JSON.stringify({ 
              _id: { $in: ids },
            //   roles: { $elemMatch: { label: 'Agent' } }
            })
          })
          if (result.data && result.data.length > 0) {
            // 保留现有经纪人列表中不在新获取数据中的项
            const existingAgents = this.agents.filter(
              agent => !result.data.find(a => a._id === agent._id)
            )
            this.agents = [...existingAgents, ...result.data]
          }
        } catch (error) {
          console.error('获取经纪人信息失败:', error)
        }
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .agent-option {
    padding: 5px 0;
  
    .agent-info {
      display: flex;
      align-items: center;
      gap: 8px;
  
      .name {
        font-weight: 500;
      }
    }
  
    .company-info {
      margin-top: 4px;
      color: #909399;
      font-size: 12px;
    }
  }
  </style>