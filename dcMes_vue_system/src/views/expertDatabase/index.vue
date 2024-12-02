<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div slot="header" class="clearfix">
        <span>筛选搜索</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="toggleAdvanced">
          {{ showAdvanced ? '收起' : '展开' }}高级搜索
        </el-button>
      </div>

      <el-form :model="searchForm" ref="searchForm" class="demo-form-inline">
        <el-row :gutter="0">
          <el-col :span="6">
            <el-form-item label="达人姓名">
              <el-input v-model="searchForm.name" placeholder="请输入达人姓名" clearable></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="合作平台">
              <el-select v-model="searchForm.platformName" placeholder="请选择平台" clearable style="width: 100%">
                <el-option v-for="dict in dict.type.expert_platform" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="平台ID">
              <el-input v-model="searchForm.platformId" placeholder="请输入平台ID" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="平台昵称">
              <el-input v-model="searchForm.platformNickname" placeholder="请输入平台昵称" clearable></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="平台链接">
              <el-input v-model="searchForm.platformUrl" placeholder="请输入平台链接" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="签约机构">
              <el-input v-model="searchForm.agency" placeholder="请输入签约机构" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="达人等级">
              <el-select v-model="searchForm.level" placeholder="请选择达人等级" clearable style="width: 100%">
                <el-option v-for="dict in dict.type.level" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="WhatsApp">
              <el-input v-model="searchForm.whatsappAccount" placeholder="请输入WhatsApp账号" clearable></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="达人分类">
              <el-select v-model="searchForm.category" placeholder="请选择达人分类" clearable style="width: 100%">
                <el-option v-for="dict in dict.type.category" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="带货方式">
              <el-select v-model="searchForm.sellingMethod" multiple collapse-tags placeholder="请选择带货方式"
                style="width: 100%">
                <el-option v-for="dict in dict.type.delivery_method" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="国家">
              <ZrAddressSelect :checkStrictly="true" :isMultiple="true" v-model="searchForm.area" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="合作品牌">
              <el-select v-model="searchForm.cooperationBrands" multiple filterable allow-create default-first-option
                clearable placeholder="请选择或者输入合作品牌" style="width: 100%">
                <el-option v-for="dict in dict.type.brand" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-collapse-transition>
          <div v-show="showAdvanced">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="粉丝数范围">
                  <el-input-number v-model="searchForm.minFollowers" :min="0" placeholder="最小值"
                    style="width: 45%"></el-input-number>
                  <span style="margin: 0 10px">-</span>
                  <el-input-number v-model="searchForm.maxFollowers" :min="0" placeholder="最大值"
                    style="width: 45%"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="女性占比范围">
                  <el-input-number v-model="searchForm.followerWomanMin" :min="0" :max="100" placeholder="最小值"
                    style="width: 45%"></el-input-number>
                  <span style="margin: 0 10px">-</span>
                  <el-input-number v-model="searchForm.followerWomanMax" :min="0" :max="100" placeholder="最大值"
                    style="width: 45%"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-transition>

        <el-collapse-transition>
          <div v-show="showAdvanced">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="月销量范围">
                  <el-input-number v-model="searchForm.monthlySalesMin" :min="0" placeholder="最小值"
                    style="width: 45%"></el-input-number>
                  <span style="margin: 0 10px">-</span>
                  <el-input-number v-model="searchForm.monthlySalesMax" :min="0" placeholder="最大值"
                    style="width: 45%"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="月销售额范围">
                  <el-input-number v-model="searchForm.monthlySalesAmountMin" :min="0" placeholder="最小值"
                    style="width: 45%"></el-input-number>
                  <span style="margin: 0 10px">-</span>
                  <el-input-number v-model="searchForm.monthlySalesAmountMax" :min="0" placeholder="最大值"
                    style="width: 45%"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-transition>

        <el-form-item>
          <el-button type="primary" @click="search">查询搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
          <template v-if="!isSelectMode">
            <el-button type="success" @click="exportData">导出数据</el-button>
            <el-button type="warning" @click="showImportDialog">导入数据</el-button>
            <el-button type="info" @click="downloadTemplate">下载模板</el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="screen1" v-if="!isSelectMode">
      <div class="screen_content">
        <div class="screen_content_first">
          <i class="el-icon-tickets">达人列表</i>
          <el-button class="filter-item" icon="el-icon-plus" type="primary" @click="addExpert">添加达人</el-button>
        </div>
      </div>
    </div>

    <base-table ref="baseTable" :currentPage="currentPage" :highlight-current-row="true" :pageSize="pageSize"
      :tableData="tableList" :tableDataloading="listLoading" :total="total" @selection-change="handleSelectionChange"
      @handleCurrentChange="baseTableHandleCurrentChange" @handleSizeChange="baseTableHandleSizeChange">
      <template slot="law">
        <el-table-column v-if="isSelectMode" type="selection" width="55" :selectable="handleSelectable">
        </el-table-column>

        <el-table-column type="expand">
          <template slot-scope="props">
            <el-form label-position="left" inline class="expert-expand">
              <el-row class="expand-section">
                <div class="section-title">粉丝画像</div>
                <el-col :span="8">
                  <el-form-item label="粉丝年龄">
                    <span>{{ props.row.followerAgeRange || '暂无数据' }}</span>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="性别比例">
                    <span>男: {{ props.row.followerMan }}% / 女: {{ props.row.followerWoman }}%</span>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="粉丝兴趣">
                    <el-tag v-for="interest in props.row.followerInterests" :key="interest" size="mini"
                      style="margin-right: 5px">
                      {{ interest }}
                    </el-tag>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row class="expand-section">
                <div class="section-title">商业数据</div>
                <el-col :span="6">
                  <el-form-item label="热销品类占比">
                    <span>{{ props.row.hotCategoryRatio }}%</span>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="客单价">
                    <span>¥{{ props.row.productPrice || 0 }}</span>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="GPM">
                    <span>{{ props.row.gpm || 0 }}</span>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="带货方式">
                    <el-tag v-for="method in props.row.sellingMethod" :key="method" size="mini"
                      style="margin-right: 5px">
                      {{ method }}
                    </el-tag>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row class="expand-section">
                <div class="section-title">经纪人信息</div>
                <el-col :span="6">
                  <el-form-item label="经纪人">
                    <span>{{ (props.row.createBy && props.row.createBy.nickName) || '暂无数据' }}</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row class="expand-section" v-if="props.row.cooperationHistory && props.row.cooperationHistory.length">
                <div class="section-title">历史合作记录</div>
                <el-table :data="props.row.cooperationHistory" size="mini" border style="width: 100%">
                  <el-table-column prop="brands" label="合作品牌" width="180"></el-table-column>
                  <el-table-column prop="videos" label="视频/直播" width="180"></el-table-column>
                  <el-table-column prop="score" label="评分" width="100"></el-table-column>
                  <el-table-column prop="sales" label="销售额" width="120">
                    <template slot-scope="scope">
                      ¥{{ formatNumber(scope.row.sales) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注"></el-table-column>
                </el-table>
              </el-row>
            </el-form>
          </template>
        </el-table-column>

        <el-table-column label="平台ID" width="120">
          <template slot-scope="scope">
            <el-tag type="info">{{ scope.row.platformId }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="昵称" width="120">
          <template slot-scope="scope">
            {{ scope.row.nickname }}
          </template>
        </el-table-column>

        <el-table-column label="平台" width="120">
          <template slot-scope="scope">
            <el-tag type="success">{{ scope.row.platformName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="120">
          <template slot-scope="scope">
            <el-tag v-for="category in scope.row.category" :key="category" size="mini" style="margin-right: 5px">
              {{ category }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="带货方式" width="120">
          <template slot-scope="scope">
            <el-tag v-for="method in scope.row.sellingMethod" :key="method" size="mini" style="margin-right: 5px">
              {{ method }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="签约机构" width="150">
          <template slot-scope="scope">
            <span v-if="scope.row.agency">
              <i class="el-icon-office-building"></i> {{ scope.row.agency }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <!-- 经纪人 -->
        <el-table-column label="经纪人" width="120">
          <template slot-scope="scope">
            <span>{{ (scope.row.createBy && scope.row.createBy.nickName) || '暂无数据' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="达人等级" width="120">
          <template slot-scope="scope">
            <el-tag type="warning">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="粉丝数" width="120">
          <template slot-scope="scope">
            {{ fansNumber(scope.row.followers) }}
          </template>
        </el-table-column>

        <!-- 女粉占比 -->
        <el-table-column label="女粉占比" width="120">
          <template slot-scope="scope">
            <span>{{ scope.row.followerWoman || 0 }}%</span>
          </template>
        </el-table-column>

        <el-table-column label="互动率" width="100">
          <template slot-scope="scope">
            <span :class="getEngagementClass(scope.row.averageEngagement)">
              {{ scope.row.averageEngagement }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column label="平均播放" width="120">
          <template slot-scope="scope">
            {{ fansNumber(scope.row.averageViews) }}
          </template>
        </el-table-column>

        <!-- <el-table-column label="视频数" width="100">
          <template slot-scope="scope">
            {{ scope.row.videoCount || 0 }}
          </template>
        </el-table-column> -->

        <!-- 月销量 -->
        <el-table-column label="月销量" width="100">
          <template slot-scope="scope">
            {{ scope.row.monthlySales || 0 }}
          </template>
        </el-table-column>

        <!-- 月销售额 -->
        <el-table-column label="月销售额" width="100">
          <template slot-scope="scope">
            {{ scope.row.monthlySalesAmount || 0 }}
          </template>
        </el-table-column>

        <el-table-column label="地区" width="180">
          <template slot-scope="scope">
            <div v-if="scope.row.area">
              {{ formatArea(scope.row.area) }}
            </div>
            <div v-else>未填写地区信息</div>
          </template>
        </el-table-column>

        <el-table-column label="平台链接" width="120">
          <template slot-scope="scope">
            <el-link type="primary" :href="scope.row.platformUrl" target="_blank" v-if="scope.row.platformUrl">
              <i class="el-icon-link"></i> 访问
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="WhatsApp" width="120">
          <template slot-scope="scope">
            <span v-if="scope.row.whatsappAccount">
              <i class="el-icon-chat-dot-square"></i> {{ scope.row.whatsappAccount }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="客单价" width="120">
          <template slot-scope="scope">
            <template v-if="scope.row.productPriceMin || scope.row.productPriceMax">
              ¥{{ scope.row.productPriceMin || 0 }} - ¥{{ scope.row.productPriceMax || 0 }}
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="GPM" width="100">
          <template slot-scope="scope">
            <span :class="getGPMClass(scope.row.gpm)">
              {{ scope.row.gpm || 0 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="合作次数" width="100">
          <template slot-scope="scope">
            <el-tag type="info" size="mini">
              {{ scope.row.collaborationCount || 0 }}
            </el-tag>
          </template>
        </el-table-column>



        <el-table-column align="center" label="操作" width="180" fixed="right" v-if="!isSelectMode">
          <template slot-scope="{ row }">
            <template>
              <el-button size="mini" type="text" @click="handleView(row)">查看详情</el-button>
              <template v-if="hasPermission(row)">
                <el-button size="mini" type="text" @click="handleEdit(row)">编辑</el-button>
                <el-button size="mini" type="text" @click="handleDelete(row)">删除</el-button>
              </template>
            </template>
          </template>
        </el-table-column>
      </template>
    </base-table>
    <edit-dialog :dialogFormVisible.sync="dialogFormVisible" :dialogStatus="dialogStatus" :dataForm="dataForm"
      @submit="handleSubmit" />

    <!-- 添加详情弹窗 -->
    <el-dialog title="达人详情" :visible.sync="detailDialogVisible" @close="detailDialogClose" width="80%"
      custom-class="modern-expert-dialog">
      <div class="expert-detail-container">
        <!-- 整合后的账号信息卡片 -->
        <el-card class="detail-card account-info">
          <div slot="header" class="card-header">
            <i class="el-icon-user"></i>
            <span>账号信息</span>
          </div>

          <!-- 基础账号信息 -->
          <div class="section-block">
            <div class="section-title">基础信息</div>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-item">
                  <span class="label">所属平台</span>
                  <el-tag type="success" effect="dark">{{ detailForm.platformName }}</el-tag>
                </div>
                <div class="info-item">
                  <span class="label">平台ID</span>
                  <el-tag type="info" effect="plain">{{ detailForm.platformId }}</el-tag>
                </div>
                <div class="info-item">
                  <span class="label">平台昵称</span>
                  <span class="value highlight">{{ detailForm.nickname }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <span class="label">账号链接</span>
                  <el-link type="primary" :href="detailForm.platformUrl" target="_blank" v-if="detailForm.platformUrl">
                    <i class="el-icon-link"></i> 访问主页
                  </el-link>
                  <span class="empty-value" v-else>暂无链接</span>
                </div>
                <div class="info-item">
                  <span class="label">达人等级</span>
                  <el-tag type="warning" effect="dark" class="level-tag">{{ detailForm.level }}</el-tag>
                </div>
                <div class="info-item">
                  <span class="label">经纪人</span>
                  <span class="value">{{ detailForm.createBy && detailForm.createBy.nickName || '暂无' }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item full-width">
                  <span class="label">账号分类</span>
                  <div class="tags-container">
                    <el-tag v-for="category in detailForm.category" :key="category" size="small" effect="light"
                      class="category-tag">
                      {{ category }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 联系方式部分 -->
          <div class="section-block">
            <div class="section-title">联系方式</div>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-item">
                  <span class="label">电话</span>
                  <span class="value">{{ detailForm.phone || '暂无' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">WhatsApp</span>
                  <span class="value">{{ detailForm.whatsappAccount || '暂无' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">签约机构</span>
                  <span class="value">{{ detailForm.agency || '暂无' }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item full-width">
                  <span class="label">其他联系方式</span>
                  <span class="value">{{ detailForm.contactInfo || '暂无' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 平台数据部分 -->
          <div class="section-block">
            <div class="section-title">平台数据</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ fansNumber(detailForm.followers) }}</div>
                <div class="stat-label">粉丝数量</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" :class="getEngagementClass(detailForm.averageEngagement)">
                  {{ detailForm.averageEngagement }}%
                </div>
                <div class="stat-label">平均互动率</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ fansNumber(detailForm.averageViews) }}</div>
                <div class="stat-label">平均播放量</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">¥{{ formatNumber(detailForm.monthlySalesAmount) }}</div>
                <div class="stat-label">月销售额</div>
              </div>
            </div>
          </div>

          <!-- 粉丝画像部分 -->
          <div class="section-block">
            <div class="section-title">粉丝画像</div>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-item">
                  <span class="label">男性粉丝</span>
                  <div class="percentage-bar">
                    <div class="percentage-value">{{ detailForm.followerMan }}%</div>
                    <div class="progress-bar">
                      <div class="progress-inner male" :style="{ width: detailForm.followerMan + '%' }"></div>
                    </div>
                  </div>
                </div>
                <div class="info-item">
                  <span class="label">女性粉丝</span>
                  <div class="percentage-bar">
                    <div class="percentage-value">{{ detailForm.followerWoman }}%</div>
                    <div class="progress-bar">
                      <div class="progress-inner female" :style="{ width: detailForm.followerWoman + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 合并后的带货数据与合作历史卡片 -->
        <el-card class="detail-card sales-history">
          <div slot="header" class="card-header">
            <i class="el-icon-shopping-cart-full"></i>
            <span>带货数据与合作历史</span>
          </div>

          <!-- 带货数据部分 -->
          <div class="section-block">
            <div class="section-title">
              <i class="el-icon-data-line"></i>
              <span>带货数据</span>
            </div>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-item">
                  <span class="label">热销品类占比</span>
                  <div class="tags-container">
                    <el-tag v-for="ratio in detailForm.hotCategoryRatio" :key="ratio" size="small" effect="light"
                      class="category-tag">
                      {{ ratio }}
                    </el-tag>
                  </div>
                </div>
                <div class="info-item">
                  <span class="label">带货方式</span>
                  <div class="tags-container">
                    <el-tag v-for="method in detailForm.sellingMethod" :key="method" type="success" effect="light"
                      size="small">
                      {{ method }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <span class="label">客单价区间</span>
                  <span class="value">¥{{ detailForm.productPriceMin || 0 }} - ¥{{ detailForm.productPriceMax || 0
                    }}</span>
                </div>
                <div class="info-item">
                  <span class="label">GPM</span>
                  <span class="value" :class="getGPMClass(detailForm.gpm)">{{ detailForm.gpm || 0 }}</span>
                </div>
                <div class="info-item">
                  <span class="label">月销量</span>
                  <span class="value highlight">{{ detailForm.monthlySales || 0 }}</span>
                </div>
                <div class="info-item">
                  <span class="label">月销售额</span>
                  <span class="value highlight">¥{{ detailForm.monthlySalesAmount || 0 }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item full-width">
                  <span class="label">带货TOP3产品</span>
                  <div class="tags-container">
                    <el-tag v-for="product in detailForm.top3Products" :key="product" type="warning" effect="light"
                      size="small">
                      {{ product }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 合作历史部分 -->
          <div class="section-block">
            <div class="section-title">
              <i class="el-icon-time"></i>
              <span>合作历史</span>
              <span class="cooperation-count">共{{ (detailForm.cooperationHistory || []).length }}次合作</span>
            </div>
            <el-table :data="detailForm.cooperationHistory || []" style="width: 100%" :max-height="400"
              class="history-table">
              <el-table-column label="品牌信息" width="200">
                <template slot-scope="scope">
                  <div class="brand-info">
                    <div class="brand-name">{{ scope.row.brandName }}</div>
                    <el-tag size="mini" effect="plain">{{ scope.row.brandCategory }}</el-tag>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="视频数据" width="300">
                <template slot-scope="scope">
                  <div class="video-stats">
                    <div class="stat-item">
                      <i class="el-icon-video-camera"></i>
                      <el-link type="primary" @click="openUrl(scope.row.videoUrl)" v-if="scope.row.videoUrl">
                        查看视频
                      </el-link>
                      <span v-else>暂无视频</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">发布时间：</span>
                      <span>{{ formatDate(scope.row.videoPublishTime) }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">GMV：</span>
                      <span class="highlight">¥{{ formatNumber(scope.row.videoGMV) }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">订单数：</span>
                      <span>{{ formatNumber(scope.row.videoOrders) }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="互动数据" width="200">
                <template slot-scope="scope">
                  <div class="interaction-stats">
                    <div class="stat-row">
                      <i class="el-icon-view"></i>
                      <span>{{ formatNumber(scope.row.videoViews) }}</span>
                    </div>
                    <div class="stat-row">
                      <i class="el-icon-star-on"></i>
                      <span>{{ formatNumber(scope.row.videoLikes) }}</span>
                    </div>
                    <div class="stat-row">
                      <i class="el-icon-chat-dot-round"></i>
                      <span>{{ formatNumber(scope.row.videoComments) }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="直播数据" width="250">
                <template slot-scope="scope">
                  <div class="live-stats">
                    <div class="stat-row">
                      <span class="stat-label">直播时间：</span>
                      <span>{{ formatDate(scope.row.liveTime) }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">GMV：</span>
                      <span class="highlight">¥{{ formatNumber(scope.row.liveGMV) }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">订单数：</span>
                      <span>{{ formatNumber(scope.row.liveOrders) }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="评价" width="200">
                <template slot-scope="scope">
                  <div class="evaluation">
                    <el-rate v-model="scope.row.score" disabled show-score></el-rate>
                    <div class="remark" v-if="scope.row.remark">
                      <i class="el-icon-tickets"></i>
                      {{ scope.row.remark }}
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 添加导入对话框 -->
    <el-dialog title="导入达人数据" :visible.sync="importDialogVisible" width="500px">
      <div class="import-dialog">
        <el-upload class="upload-demo" drag action="#" :auto-upload="false" :on-change="handleFileChange"
          :file-list="fileList" accept=".xlsx,.xls">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">只能上传 xlsx/xls 文件</div>
        </el-upload>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="importData" :loading="importing">开始导入</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getData, addData, updateData, removeData } from "@/api/data";
import EditDialog from './editDialog.vue'; // 导入 editDialog 组件
// 引入 xlsx
import XLSX from 'xlsx';
// 导入地区数据
import countryOptions from '@/components/ZrAddressSelect/countryOptions.json'
import ZrAddressSelect from '@/components/ZrAddressSelect/index.vue';

export default {
  name: 'ExpertDatabase',
  props: {
    // 是否为选择模式
    isSelectMode: {
      type: Boolean,
      default: false
    },
    // 选择模式相关属性
    multiple: {
      type: Boolean,
      default: true
    },
    selectedIds: {
      type: Array,
      default: () => []
    },
    maxSelect: {
      type: Number,
      default: 999
    },
    // 添加自定义选择检查函数
    checkSelectable: {
      type: Function,
      default: null
    }
  },
  dicts: ['delivery_method', 'expert_platform', 'category', 'level', 'brand'],
  components: {
    EditDialog,// 注册 editDialog 组件
    ZrAddressSelect
  },
  data() {
    return {
      searchForm: {
        name: '',
        mainNickname: '',
        mainPlatform: '',
        mainCategory: '',
        minFollowers: null,
        maxFollowers: null,
        area: [],
        platformName: '',
        platformId: '',
        platformNickname: '',
        platformUrl: '',
        whatsappAccount: '',
        agency: '',
        productPriceMin: null,
        productPriceMax: null,
        gpmMin: null,
        gpmMax: null,
        sellingMethod: [],
        followerWomanMin: null,
        followerWomanMax: null,
        monthlySalesMin: null,
        monthlySalesMax: null,
        monthlySalesAmountMin: null,
        monthlySalesAmountMax: null,
        cooperationBrands: [], // 添加合作品牌搜索字段
      },
      showAdvanced: false,
      platformOptions: [
        { value: '抖音', label: '抖音' },
        { value: '小红书', label: '小红书' },
        { value: '微博', label: '微博' },
        { value: 'B站', label: 'B站' },
      ],
      tableList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: true,
      dialogFormVisible: false,
      dialogStatus: '',
      dataForm: {
        avatar: '',
        name: '',
        phone: '',
        bio: '',
        mainPlatform: '',
        mainNickname: '',
        mainFollowers: 0,
        mainCategory: '',
        contactInfo: '',
        agency: '',
        averageViews: 0,
        monthlySales: 0, // 月销量
        monthlySalesAmount: 0, // 月销售额
        followerAgeRange: '', // 粉丝年龄范围
        followerMan: 0, // 粉丝男性比例
        followerWoman: 0, // 粉丝女性比例
        followerInterests: [], // 粉丝兴趣
        followerLocation: [], // 粉丝主要地理位置
        hotCategoryRatio: [],
        platforms: [],
        top3Products: [],
        sellingMethod: '',
        productPrice: 0,
        gpm: 0,
        cooperationHistory: [],
        collaborationCount: 0,
        level: '',
      },
      detailForm: {
        cooperationHistory: [], // 初始化为空数组
        // ... 其他字段
      },
      importDialogVisible: false,
      fileList: [],
      importing: false,
      templateHeaders: [
        '平台名称*', '平台ID*', '平台昵称*', '平台链接',
        '粉丝数量', '分类', '平均互动率', '平均播放量',
        '视频平均时长',

        // 地区信息
        '地区', '国家', '省份', '城市',

        // 联系信息
        '联系方式', '签约机构', 'WhatsApp账号', '电话',

        // 粉丝画像
        '粉丝年龄范围', '男性粉丝比例', '女性粉丝比例',

        // 商业数据
        '热销品类比', 'Top3产品', '带货方式',
        '最低客单价', '最高客单价', 'GPM'
      ],
      selection: [], // 新增：存储选中的达人
      detailDialogVisible: false,

    };
  },
  created() {
    this.fetchData();
  },
  methods: {

    searchData() {
      console.log("🚀 ~ searchData ~ this.searchForm.area:", this.searchForm.area)
      let req = {
        query: {
          $and: [], // 初始化 $and 数组
        },
        populate: JSON.stringify([{ path: 'createBy', select: 'nickName' }])
      };

      // 基础字段查询
      if (this.searchForm.name) {
        req.query.$and.push({ name: { $regex: this.searchForm.name, $options: 'i' } });
      }
      if (this.searchForm.platformName) {
        req.query.$and.push({ platformName: { $regex: this.searchForm.platformName, $options: 'i' } });
      }
      if (this.searchForm.platformId) {
        req.query.$and.push({ platformId: { $regex: this.searchForm.platformId, $options: 'i' } });
      }
      if (this.searchForm.platformNickname) {
        req.query.$and.push({ nickname: { $regex: this.searchForm.platformNickname, $options: 'i' } });
      }
      if (this.searchForm.mainCategory) {
        req.query.$and.push({ category: { $regex: this.searchForm.mainCategory, $options: 'i' } });
      }

      // 添加地区查询条
      if (this.searchForm.area && this.searchForm.area.length > 0) {
        // 使用 $or 来匹配任意一个地区路径
        req.query.$and.push({
          $or: this.searchForm.area.map(areaPath => ({
            area: { $all: areaPath }
          }))
        });
      }

      // 粉丝数范围查询
      if ((this.searchForm.minFollowers !== null || this.searchForm.maxFollowers !== null) && (this.searchForm.minFollowers !== 0 || this.searchForm.maxFollowers !== 0)) {
        const followersQuery = {};
        if (this.searchForm.minFollowers !== null) {
          followersQuery.$gte = this.searchForm.minFollowers;
        }
        if (this.searchForm.maxFollowers !== null) {
          followersQuery.$lte = this.searchForm.maxFollowers;
        }
        if (Object.keys(followersQuery).length > 0) {
          req.query.$and.push({ followers: followersQuery });
        }
      }

      // 账号分类查询
      if (this.searchForm.category && this.searchForm.category.length > 0) {
        req.query.$and.push({ category: { $all: this.searchForm.category } });
      }

      // 达人等级查询
      if (this.searchForm.level) {
        req.query.$and.push({ level: { $regex: this.searchForm.level, $options: 'i' } });
      }

      // 添加新的搜索条件
      if (this.searchForm.platformUrl) {
        req.query.$and.push({ platformUrl: { $regex: this.searchForm.platformUrl, $options: 'i' } });
      }
      if (this.searchForm.whatsappAccount) {
        req.query.$and.push({ whatsappAccount: { $regex: this.searchForm.whatsappAccount, $options: 'i' } });
      }
      if (this.searchForm.agency) {
        req.query.$and.push({ agency: { $regex: this.searchForm.agency, $options: 'i' } });
      }
      if (this.searchForm.level) {
        req.query.$and.push({ level: { $regex: this.searchForm.level, $options: 'i' } });
      }

      // 修改客单价范围查询逻辑
      if (this.searchForm.productPriceMin || this.searchForm.productPriceMax) {
        const priceQuery = {};
        if (this.searchForm.productPriceMin) {
          priceQuery.$gte = this.searchForm.productPriceMin;
        }
        if (this.searchForm.productPriceMax) {
          priceQuery.$lte = this.searchForm.productPriceMax;
        }
        if (Object.keys(priceQuery).length > 0) {
          req.query.$and.push({ productPrice: priceQuery });
        }
      }

      // 修改GPM范围查询逻辑
      if (this.searchForm.gpmMin || this.searchForm.gpmMax) {
        const gpmQuery = {};
        if (this.searchForm.gpmMin) {
          gpmQuery.$gte = this.searchForm.gpmMin;
        }
        if (this.searchForm.gpmMax) {
          gpmQuery.$lte = this.searchForm.gpmMax;
        }
        if (Object.keys(gpmQuery).length > 0) {
          req.query.$and.push({ gpm: gpmQuery });
        }
      }

      // 添加带货方式查询条件
      if (this.searchForm.sellingMethod && this.searchForm.sellingMethod.length > 0) {
        req.query.$and.push({
          sellingMethod: { $all: this.searchForm.sellingMethod }
        });
      }

      // 修改女性占比范围查询
      if ((this.searchForm.followerWomanMin !== null && this.searchForm.followerWomanMin !== 0) ||
        (this.searchForm.followerWomanMax !== null && this.searchForm.followerWomanMax !== 0)) {
        const followerWomanQuery = {};
        if (this.searchForm.followerWomanMin !== null && this.searchForm.followerWomanMin !== 0) {
          followerWomanQuery.$gte = this.searchForm.followerWomanMin;
        }
        if (this.searchForm.followerWomanMax !== null && this.searchForm.followerWomanMax !== 0) {
          followerWomanQuery.$lte = this.searchForm.followerWomanMax;
        }
        if (Object.keys(followerWomanQuery).length > 0) {
          req.query.$and.push({ followerWoman: followerWomanQuery });
        }
      }

      // 修改月销量范围查询
      if ((this.searchForm.monthlySalesMin !== null && this.searchForm.monthlySalesMin !== 0) ||
        (this.searchForm.monthlySalesMax !== null && this.searchForm.monthlySalesMax !== 0)) {
        const monthlySalesQuery = {};
        if (this.searchForm.monthlySalesMin !== null && this.searchForm.monthlySalesMin !== 0) {
          monthlySalesQuery.$gte = this.searchForm.monthlySalesMin;
        }
        if (this.searchForm.monthlySalesMax !== null && this.searchForm.monthlySalesMax !== 0) {
          monthlySalesQuery.$lte = this.searchForm.monthlySalesMax;
        }
        if (Object.keys(monthlySalesQuery).length > 0) {
          req.query.$and.push({ monthlySales: monthlySalesQuery });
        }
      }

      // 修改月销售额范围查询
      if ((this.searchForm.monthlySalesAmountMin !== null && this.searchForm.monthlySalesAmountMin !== 0) ||
        (this.searchForm.monthlySalesAmountMax !== null && this.searchForm.monthlySalesAmountMax !== 0)) {
        const monthlySalesAmountQuery = {};
        if (this.searchForm.monthlySalesAmountMin !== null && this.searchForm.monthlySalesAmountMin !== 0) {
          monthlySalesAmountQuery.$gte = this.searchForm.monthlySalesAmountMin;
        }
        if (this.searchForm.monthlySalesAmountMax !== null && this.searchForm.monthlySalesAmountMax !== 0) {
          monthlySalesAmountQuery.$lte = this.searchForm.monthlySalesAmountMax;
        }
        if (Object.keys(monthlySalesAmountQuery).length > 0) {
          req.query.$and.push({ monthlySalesAmount: monthlySalesAmountQuery });
        }
      }

      // 添加合作品牌查询条件
      if (this.searchForm.cooperationBrands && this.searchForm.cooperationBrands.length > 0) {
        req.query.$and.push({
          'cooperationHistory.brandName': { $in: this.searchForm.cooperationBrands }
        });
      }

      // 如果没有查询条件，删除 $and
      if (!req.query.$and.length) {
        delete req.query.$and;
      }

      return req;
    },
    async fetchData() {
      this.listLoading = true;
      // 优化移除空的查询条件
      let req = this.searchData();
      let result = await getData("expert", req);
      this.tableList = result.data;
      this.total = result.countnum;
      this.listLoading = false;
    },
    search() {
      this.currentPage = 1;
      this.fetchData();
    },
    handleEdit(row) {
      this.dialogStatus = 'update';
      this.dataForm = { ...row };
      this.dialogFormVisible = true;
    },
    handleSubmit(data) {
      if (this.dialogStatus === 'create') {
        this.createExpert(data);
      } else {
        this.updateExpert(data);
      }
    },
    handleView(row) {
      this.detailDialogVisible = true;
      this.detailForm = {
        ...row,
        cooperationHistory: row.cooperationHistory || [] // 确保有默认值
      };
    },
    handleDelete(row) {
      this.$confirm('确认删除达人?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await removeData("expert", { query: { _id: row._id } });
        this.$message.success('删除成功');
        this.fetchData();
      }).catch(() => { });
    },
    detailDialogClose() {
      this.detailDialogVisible = false;
      this.detailForm = {};
    },
    addExpert() {
      this.dialogStatus = 'create';
      this.dataForm = {
        avatar: '',
        name: '',
        phone: '',
        bio: '',
        mainPlatform: '',
        mainNickname: '',
        mainFollowers: 0,
        mainCategory: '',
        contactInfo: '',
        area: [],
        agency: '',
        averageViews: 0,
        monthlySales: 0, // 月销量
        monthlySalesAmount: 0, // 月销售额
        followerAgeRange: '', // 粉丝年龄范围
        followerMan: 0, // 粉男性比例
        followerWoman: 0, // 粉丝女性比例
        followerInterests: [], // 粉丝兴趣
        followerLocation: [], // 粉丝主要地理位置
        hotCategoryRatio: [],
        top3Products: [],
        platforms: [],
        sellingMethod: '',
        productPrice: 0,
        gpm: 0,
        cooperationHistory: [],
        collaborationCount: 0,
        level: '',
      };
      this.dialogFormVisible = true;
    },
    async createExpert() {
      console.log("🚀 ~ createExpert ~ this.dataForm:", this.dataForm)
      let result = await addData("expert", this.dataForm);
      if (result.code === 200) {
        this.$message.success('添加成功');
        this.dialogFormVisible = false;
        this.fetchData();
      } else {
        this.$message.error('添加失败');
      }
    },
    async updateExpert() {
      let result = await updateData("expert", {
        query: { _id: this.dataForm._id },
        update: this.dataForm
      });
      if (result.code === 200) {
        this.$message.success('更新成功');
        this.dialogFormVisible = false;
        this.fetchData();
      } else {
        this.$message.error('更新失败');
      }
    },
    handleAvatarSuccess(res, file) {
      this.dataForm.avatar = URL.createObjectURL(file.raw);
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    },
    fansNumber(totalFollowers) {
      // 添加单位转换逻辑
      if (totalFollowers < 1000) {
        return totalFollowers.toString();
      } else if (totalFollowers < 10000) {
        return (totalFollowers / 1000).toFixed(1) + 'k';
      } else if (totalFollowers < 1000000) {
        return (totalFollowers / 10000).toFixed(1) + 'w';
      } else if (totalFollowers < 10000000) {
        return (totalFollowers / 10000).toFixed(1) + 'w';
      } else if (totalFollowers < 100000000) {
        return (totalFollowers / 10000000).toFixed(1) + '千万';
      } else {
        return (totalFollowers / 100000000).toFixed(1) + '亿';
      }
    },
    formatFansNumber(platforms) {
      const totalFollowers = platforms.reduce((acc, platform) => acc + platform.followers, 0);
      // 添加单位转换逻辑
      if (totalFollowers < 1000) {
        return totalFollowers.toString();
      } else if (totalFollowers < 10000) {
        return (totalFollowers / 1000).toFixed(1) + 'k';
      } else if (totalFollowers < 1000000) {
        return (totalFollowers / 10000).toFixed(1) + 'w';
      } else if (totalFollowers < 10000000) {
        return (totalFollowers / 10000).toFixed(1) + 'w';
      } else {
        return (totalFollowers / 10000000).toFixed(1) + '千万';
      }
    },
    formatNumber(num) {
      if (num === undefined || num === null) {
        return '0';
      }
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    },
    baseTableHandleCurrentChange(currentPage) {
      this.currentPage = currentPage;
      this.fetchData();
    },
    baseTableHandleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.fetchData();
    },
    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },
    resetForm() {
      this.$refs.searchForm.resetFields(); // 重置表单字段
      this.searchForm = { // 重新设置 searchForm 的初始值
        name: '',
        platformName: '',
        platformId: '',
        platformNickname: '',
        platformUrl: '',
        agency: '',
        whatsappAccount: '',
        level: '',
        category: '',
        sellingMethod: [],
        area: [],
        cooperationBrands: [],
        // 数值类型字段需要明确设置为 null
        minFollowers: null,
        maxFollowers: null,
        followerWomanMin: null,
        followerWomanMax: null,
        monthlySalesMin: null,
        monthlySalesMax: null,
        monthlySalesAmountMin: null,
        monthlySalesAmountMax: null
      };
      this.currentPage = 1; // 重置当前页为 1
      this.fetchData(); // 重新获取数据
    },
    async exportData() {
      try {
        this.$message({
          message: '正在导出数据,请稍候...',
          type: 'info'
        });

        const loading = this.$loading({
          lock: true,
          text: '导出中...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        let req = this.searchData();
        req.limit = 1000000;
        const response = await getData("expert", req);

        if (!response.data || response.data.length === 0) {
          this.$message.warning('没有数据可供导出');
          loading.close();
          return;
        }

        // 根据数据库���型定义导出配置
        const exportConfig = {
          // 基础信息
          avatar: '头像URL',
          name: '姓名',
          phone: '电话',
          bio: '个人简介',

          // 平台信息
          platformName: '平台名称',
          platformId: '平台ID',
          nickname: '平台昵称',
          followers: '粉丝数量',
          category: '分类',
          level: '达人等级',
          sellingMethod: '带货方式',
          averageEngagement: '平均互动率',
          averageViews: '平均播放量',
          //videoCount: '视频数量',
          videoDuration: '视频平均时长',
          //isMainPlatform: '是否主平台',

          // 地区信息
          country: '国家',
          region: '地区',
          city: '城市',

          // 联系与机构信息
          contactInfo: '联系式',
          agency: '签约机构',

          // 粉丝画像
          followerAgeRange: '粉丝年龄范围',
          followerMan: '男性粉丝比例',
          followerWoman: '女性粉丝比例',
          followerInterests: '粉丝兴趣',
          followerLocation: '粉丝地理分布',

          // 商业数据
          hotCategoryRatio: '热销品类占比',
          top3Products: 'Top3产品',
          sellingMethod: '带货方式',
          productPrice: '商品客单价',
          gpm: 'GPM',
          monthlySales: '月销量',
          monthlySalesAmount: '月销售额',

          collaborationCount: '合作次数',
          // 时间信息
          createAt: '创建时间',
          updateAt: '更新时间'
        };

        // 处理数据
        const processedData = response.data.map(item => {
          const row = {};

          // 处理基础字段
          Object.keys(exportConfig).forEach(key => {
            let value = item[key];

            // 特殊字段�����
            switch (key) {
              case 'followers':
              case 'averageViews':
                value = this.fansNumber(value);
                break;
              case 'followerMan':
              case 'followerWoman':
              case 'hotCategoryRatio':
              case 'averageEngagement':
                value = value ? value + '%' : '0%';
                break;
              case 'productPrice':
                value = value ? '¥' + value : '未设置';
                break;
              // case 'isMainPlatform':
              //   value = value ? '是' : '否';
              //   break;
              case 'followerInterests':
              case 'top3Products':
              case 'sellingMethod':
                value = Array.isArray(value) ? value.join('、') : '';
                break;
              case 'followerLocation':
                value = Array.isArray(value) ? value.map(loc => loc.join('-')).join('、') : '';
                break;
              case 'createAt':
              case 'updateAt':
                value = value ? new Date(value).toLocaleString() : '';
                break;
            }

            row[exportConfig[key]] = value || '未设置';
          });

          // 处理合作历史
          if (item.cooperationHistory && item.cooperationHistory.length > 0) {
            item.cooperationHistory.forEach((history, index) => {
              const prefix = `合作记录${index + 1}_`;
              row[prefix + '品牌'] = history.brands || '';
              row[prefix + '视频/直播'] = history.videos || '';
              row[prefix + '评分'] = history.score || '';
              row[prefix + '销售额'] = history.sales ? '¥' + this.formatNumber(history.sales) : '';
              row[prefix + '备注'] = history.remark || '';
            });
          }

          return row;
        });

        // 创建工作簿和工作表
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(processedData);

        // 设置列宽
        const colWidths = [];
        Object.keys(processedData[0]).forEach(key => {
          colWidths.push({ wch: Math.max(key.length * 2, 15) });
        });
        ws['!cols'] = colWidths;

        // 添加工作表到工作簿并导出
        XLSX.utils.book_append_sheet(wb, ws, '达人数据');
        const filename = `达人数据_${new Date().toLocaleDateString()}.xlsx`;
        XLSX.writeFile(wb, filename);

        loading.close();
        this.$message.success('导出成功!');

      } catch (error) {
        console.error('导出错误:', error);
        this.$message.error('导出失败: ' + (error.message || '未知错误'));
        loading.close();
      }
    },
    // 新增方法：获取互动率的式类
    getEngagementClass(rate) {
      if (!rate) return '';
      if (rate >= 5) return 'text-success';
      if (rate >= 3) return 'text-warning';
      return 'text-danger';
    },
    formatArea(areaArray) {
      if (!Array.isArray(areaArray) || areaArray.length === 0) {
        return '未填写地区信息';
      }

      let result = [];
      let currentLevel = countryOptions;

      for (let i = 0; i < areaArray.length; i++) {
        const code = areaArray[i];
        const found = currentLevel.find(item => item.value === code);

        if (found) {
          result.push(found.label);
          currentLevel = found.children || [];
        }
      }

      return result.join(' / ');
    },
    // 添加权限判断方法
    hasPermission(row) {
      // 获取当前用户信息
      const userInfo = this.$store.state.user;
      console.log('userInfo: ', userInfo);
      // 如果是超级管理员,拥有所有权限
      if (this.$store.getters.roles.label.includes('Admin')) {
        return true;
      }

      // 如果是经纪人,只能编辑删除自己创建的数据
      return row.createBy === userInfo.id;
    },
    // 添加GPM样式判断方法
    getGPMClass(gpm) {
      if (!gpm) return '';
      if (gpm >= 1000) return 'text-success';
      if (gpm >= 500) return 'text-warning';
      return 'text-danger';
    },
    showImportDialog() {
      this.importDialogVisible = true;
      this.fileList = [];
    },

    handleFileChange(file) {
      this.fileList = [file];
    },

    async importData() {
      if (!this.fileList.length) {
        this.$message.warning('请先选择要导入的文件');
        return;
      }

      try {
        this.importing = true;
        const file = this.fileList[0].raw;
        const reader = new FileReader();

        reader.onload = async (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // 数据验证和转换
          const processedData = jsonData.map(row => this.processImportRow(row));

          // 验证必字段
          const invalidData = processedData.filter(item =>
            !item.platformName || !item.platformId || !item.nickname
          );

          if (invalidData.length > 0) {
            this.$message.error('存在数据缺少必填字段（平台名称、平台ID、平台昵称），请检查');
            return;
          }

          // 检查重复的平台ID
          const platformIds = processedData.map(item => item.platformId);
          const duplicateIds = platformIds.filter((id, index) =>
            platformIds.indexOf(id) !== index
          );

          if (duplicateIds.length > 0) {
            this.$message.error(`Excel中存在重复的平台ID: ${duplicateIds.join(', ')}`);
            return;
          }

          try {
            // 查询数据库中是否存在相同平台ID的记录
            const existingData = await getData("expert", {
              query: {
                platformId: { $in: platformIds }
              },
              select: 'platformId platformName nickname'
            });

            if (existingData.data && existingData.data.length > 0) {
              // 创建确认对话框，显示已存在的记录
              const existingList = existingData.data.map(item => ({
                platformId: item.platformId,
                platformName: item.platformName,
                nickname: item.nickname
              }));

              const confirmResult = await this.$confirm(
                `以下平台ID的达人已存在，是否更新？\n${existingList.map(item =>
                  `平台ID: ${item.platformId}, 平台: ${item.platformName}, 昵称: ${item.nickname}`
                ).join('\n')}`,
                '确认更新',
                {
                  confirmButtonText: '更新',
                  cancelButtonText: '取消',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                }
              ).catch(() => false);

              if (!confirmResult) {
                this.$message.info('已取消导入');
                return;
              }

              // 分离新增和更新的数据
              const existingIds = existingData.data.map(item => item.platformId);
              const newDataList = [];
              const updateDataList = [];
              console.log('existingIds: ', existingIds);
              // 遍历处理后的数据，正确分类新增和更新数据
              processedData.forEach(item => {
                console.log('item: ', item.platformId);
                if (existingIds.includes(item.platformId)) {
                  updateDataList.push(item);
                } else {
                  newDataList.push(item);
                }
              });

              console.log('新增数据: ', newDataList);
              console.log('更新数据: ', updateDataList);

              // 批量处理新增和更新
              const results = await Promise.all([
                // 新增数据
                newDataList.length > 0 ? addData("expert", newDataList) : Promise.resolve(),
                // 更新数据
                ...updateDataList.map(item =>
                  updateData("expert", {
                    query: { platformId: item.platformId },
                    update: item
                  })
                )
              ]);

              this.$message.success(`导入完成！新增: ${newDataList.length}条, 更新: ${updateDataList.length}条`);
            } else {
              console.log('processedData: ', processedData);
              // 如果没有重复数据，直接批量导入
              const dataToAdd = Array.isArray(processedData) ? processedData : [processedData];
              await addData("expert", dataToAdd);
              this.$message.success(`导入完成！新增: ${dataToAdd.length}条`);
            }

            this.importDialogVisible = false;
            this.fetchData(); // 刷新列表
          } catch (error) {
            console.error('导入错误:', error);
            this.$message.error('导入失败：' + (error.message || '未知错误'));
          }
        };

        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('处理文件时出错:', error);
        this.$message.error('处理文件时出错：' + (error.message || '未知错误'));
      } finally {
        this.importing = false;
      }
    },

    processImportRow(row) {
      // 添加安全的字符串分割函数
      const safeSplit = (value, separator = '、') => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return String(value).split(separator).filter(Boolean);
      };

      return {
        // 平台信息
        platformName: row['平台名称*'] || '',
        platformId: row['平台ID*'] ? String(row['平台ID*']).trim() : '',
        platformUrl: row['平台链接'] || '',
        nickname: row['平台昵称*'] || '',
        followers: this.parseNumber(row['粉丝数量']),
        category: safeSplit(row['分类']),
        averageEngagement: this.parseNumber(row['平均互动率']),
        averageViews: this.parseNumber(row['平均播放量']),
        // videoCount: this.parseNumber(row['视频数量']),
        videoDuration: this.parseNumber(row['视频平均时长']),

        // 地区信息
        area: safeSplit(row['地区']),
        country: row['国家'] || '',
        region: row['省份'] || '',
        city: row['城市'] || '',

        // 联系信息
        contactInfo: row['联系方式'] || '',
        agency: row['签约机构'] || '',
        whatsappAccount: row['WhatsApp账号'] || '',
        phone: row['电话'] || '',

        // 粉丝画像
        followerAgeRange: row['粉丝年龄范围'] || '',
        followerMan: this.parseNumber(row['男性粉丝比例']),
        followerWoman: this.parseNumber(row['女性粉丝比例']),
        followerInterests: safeSplit(row['粉丝兴趣']),
        followerLocation: safeSplit(row['粉丝地理位置']).map(loc =>
          typeof loc === 'string' ? loc.split('-') : [loc]
        ),

        // 商业数据
        hotCategoryRatio: safeSplit(row['热销品类占比']),
        top3Products: safeSplit(row['Top3产品']),
        sellingMethod: safeSplit(row['带货方式']),
        productPriceMin: this.parseNumber(row['最低客单价']),
        productPriceMax: this.parseNumber(row['最高客单价']),
        gpm: this.parseNumber(row['GPM']),

        // 默认值
        collaborationCount: 0,
        createBy: this.$store.state.user.id,
        updateBy: this.$store.state.user.id,
        createAt: new Date(),
        updateAt: new Date()
      };
    },

    parseNumber(value) {
      if (!value) return 0;
      const num = Number(value.toString().replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    },

    async batchImportExperts(data) {
      // 调用后端API批量导入数据
      return await addData("expert", data);
    },

    downloadTemplate() {
      // 创建模板数据
      const templateData = [
        this.templateHeaders.reduce((obj, header) => {
          obj[header] = ''; // 创建空值的示例行
          return obj;
        }, {})
      ];

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData, { header: this.templateHeaders });

      // 设置列宽
      const colWidths = this.templateHeaders.map(header => ({
        wch: Math.max(header.length * 2, 15)
      }));
      ws['!cols'] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '达人数据模板');

      // 下载文件
      XLSX.writeFile(wb, '达人数据导入模板.xlsx');
    },

    // 新增：选择模式相关方法
    handleSelectionChange(val) {
      console.log('val: ', val);
      if (this.isSelectMode) {
        this.selection = val;
        this.$emit('selection-change', val);
      }
    },

    handleSelectable(row) {
      // 首先检查自定义的选择条件
      if (this.checkSelectable && !this.checkSelectable(row)) {
        return false;
      }

      // 然后检查多选和最大数量限制
      if (this.multiple) {
        return this.selection.length < this.maxSelect || this.selection.includes(row);
      }
      return this.selection.length === 0 || this.selection.includes(row);
    },

    getSelectedExperts() {
      return this.selection;
    },

    clearSelection() {
      if (this.$refs.baseTable && this.$refs.baseTable.$refs.table) {
        this.$refs.baseTable.$refs.table.clearSelection();
        this.selection = [];
      }
    },

    setSelection(rows) {
      this.clearSelection();
      if (this.$refs.baseTable && this.$refs.baseTable.$refs.table) {
        rows.forEach(row => {
          this.$refs.baseTable.$refs.table.toggleRowSelection(row, true);
        });
      }
    },

    formatDate(date) {
      if (!date) return '暂无数据';

      // 如果传入的是字符串日期，转换为Date对象
      const dateObj = new Date(date);

      // 检查日期是否有效
      if (isNaN(dateObj.getTime())) {
        return '无效日期';
      }

      // 格式化日期
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    // 如果还没有这个方法，也需要添加 formatNumber 方法
    formatNumber(num) {
      if (!num && num !== 0) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // 如果还没有这个方法，也需要添加 openUrl 方法
    openUrl(url) {
      if (!url) return;
      window.open(url, '_blank');
    }
  },
  watch: {
    selectedIds: {
      immediate: true,
      handler(newVal) {
        if (this.isSelectMode && newVal && newVal.length) {
          const selectedRows = this.tableList.filter(item =>
            newVal.includes(item._id)
          );
          this.setSelection(selectedRows);
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.filter-container {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 10px;
}

.el-select {
  width: 100%;
}

.el-input-number {
  width: 45%;
}

.filter-item {
  margin: 10px 5px;
}

.filter-container {
  margin: 10px 0;
}

.block {
  margin: 2vw;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
}

.el-table--group::after,
.el-table--border::after,
.el-table--border::after,
.el-table--group::after {
  width: 0px !important;
}

.el-table.el-table::before {
  height: 0px !important;
}

.el-form-item {
  display: flex;
  flex-wrap: wrap;
}

.filter-item {
  margin: 0 0 !important;
}

.label1 {
  color: #409eff;
}

.label2 {
  color: #67c23a;
}

.label3 {
  color: #e6a23c;
}

.titlehead1 {
  width: 100%;
  text-align: center;
  margin: 0px 20px 20px 20px;
}

.titlehead {
  width: 100%;
  text-align: center;
  margin: 20px;
}

.screen {
  height: auto;
  margin: 2vw 0 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen1 {
  height: auto;
  margin: 2vw 0;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.screen_content {
  height: auto;
  display: flex;
  flex-direction: column;
}

.screen_content_first {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.el-icon-search {
  padding: 8px;
}

.el-icon-tickets {
  line-height: 30px;
}

.screen_content_second {
  width: 100%;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}

.screen_content_second_one {
  padding: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.forwork {
  justify-content: center;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  color: rgb(171, 177, 180);
}

.forworktitle {
  margin: 0 5px;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.expert-dialog {
  .el-dialog__body {
    padding: 30px 40px;
  }

  .el-form-item__label {
    font-weight: bold;
    color: #606266;
    padding-bottom: 8px; // 增加标签底部的内边距
  }

  .avatar-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .avatar-uploader {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 178px;
    height: 178px;

    &:hover {
      border-color: #409EFF;
    }
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }

  .avatar {
    width: 178px;
    height: 178px;
    display: block;
    object-fit: cover;
  }

  .el-divider__text {
    font-size: 18px;
    font-weight: bold;
    color: #409EFF;
  }

  .platform-info {
    position: relative;
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .remove-platform-btn {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  .add-platform-btn {
    margin-top: 20px;
  }

  .el-input-number {
    width: 100%;
  }

  .el-select {
    width: 100%;
  }

  .el-form-item {
    margin-bottom: 22px;
  }

  // 为了确保输入框和标签之间有足够的空间，可以给输入框添加上边距
  .el-input,
  .el-select,
  .el-input-number,
  .el-textarea {
    margin-top: 4px; // 给输入框添加上边距
  }
}

.expert-expand {
  padding: 20px;

  .expand-section {
    margin-bottom: 20px;

    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #409EFF;
      font-size: 14px;
    }
  }

  .el-form-item {
    margin-bottom: 10px;
  }
}

.expert-basic-info {
  display: flex;
  align-items: center;

  .info-detail {
    margin-left: 10px;

    .name {
      font-weight: bold;
      font-size: 14px;
    }

    .contact {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
  }
}

.platform-info {
  .platform-detail {
    margin-top: 8px;
    font-size: 13px;
    color: #666;

    >div {
      margin-top: 3px;
    }
  }
}

.text-success {
  color: #67C23A;
  font-weight: bold;
}

.text-warning {
  color: #E6A23C;
  font-weight: bold;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}

.expert-detail-dialog {
  .expert-detail-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 10px;
  }

  .detail-card {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 5px;

    .card-header {
      font-weight: bold;
      font-size: 16px;
      color: #409EFF;
      margin-bottom: 10px;
    }

    .basic-info {
      display: flex;
      align-items: center;

      .avatar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 20px;

        .el-avatar {
          margin-bottom: 10px;
        }

        h3 {
          font-size: 18px;
          font-weight: bold;
          color: #409EFF;
        }
      }

      .info-grid {
        display: flex;
        flex-wrap: wrap;

        .info-item {
          width: 100%;
          margin-bottom: 10px;

          .label {
            font-weight: bold;
            color: #606266;
          }

          .value {
            margin-left: 10px;
            color: #666;
          }
        }
      }
    }

    .platform-stats {
      display: flex;
      justify-content: space-around;

      flex-wrap: wrap;

      .stat-item {
        width: 48%;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: space-around;
        margin-bottom: 10px;
        border: 1px solid #ebeef5;
        border-radius: 5px;

        .el-icon {
          margin-right: 10px;
        }

        .stat-content {
          display: flex;
          flex-direction: column;

          .stat-value {
            font-weight: bold;
            font-size: 16px;
            color: #409EFF;
          }

          .stat-label {
            font-size: 14px;
            color: #666;
          }
        }
      }
    }

    .fans-profile {
      .profile-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .label {
          font-weight: bold;
          color: #606266;
        }

        .value {
          margin-left: 10px;
          color: #666;
        }
      }

      .tags {
        display: flex;
        flex-wrap: wrap;

        .interest-tag {
          margin-right: 5px;
        }
      }
    }

    .commercial-data {
      .data-row {
        display: flex;
        flex-wrap: wrap;

        .data-item {
          width: 50%;
          margin-bottom: 10px;

          .label {
            font-weight: bold;
            color: #606266;
          }

          .value {
            margin-left: 10px;
            color: #666;
          }
        }
      }
    }

    .selling-methods {
      display: flex;
      flex-wrap: wrap;

      .method-tag {
        margin-right: 5px;
      }
    }
  }

  .cooperation-history {
    grid-column: span 2; // 让合作历史卡片占据整行

    .cooperation-count {
      margin-left: 12px;
      font-size: 14px;
      color: #909399;
    }

    .history-table {
      .brand-info {
        .brand-name {
          font-weight: 500;
          margin-bottom: 4px;
        }
      }

      .video-stats,
      .interaction-stats,
      .live-stats {
        .stat-row {
          display: flex;
          align-items: center;
          margin-bottom: 4px;

          i {
            margin-right: 8px;
            color: #909399;
          }

          .stat-label {
            color: #909399;
            margin-right: 8px;
          }

          .highlight {
            color: #409EFF;
            font-weight: 500;
          }
        }
      }

      .interaction-stats {
        .stat-row {
          i {
            width: 16px;
            text-align: center;
          }
        }
      }

      .evaluation {
        .remark {
          margin-top: 8px;
          color: #909399;
          font-size: 13px;

          i {
            margin-right: 4px;
          }
        }
      }
    }
  }
}

.import-dialog {
  .el-upload-dragger {
    width: 100%;
    height: 200px;
  }

  .el-upload__tip {
    margin-top: 10px;
    color: #909399;
  }
}

.modern-expert-dialog {
  .expert-detail-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 20px;
    background: #f5f7fa;
  }

  .detail-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      background: linear-gradient(to right, #f0f2f5, #ffffff);

      i {
        margin-right: 8px;
        font-size: 18px;
        color: #409EFF;
      }

      span {
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(120deg, #409EFF, #36cfc9);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }

  .info-grid {
    padding: 20px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .info-item {
    flex: 1;
    margin-right: 24px;

    &:last-child {
      margin-right: 0;
    }

    &.full-width {
      width: 100%;
    }

    .label {
      display: block;
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }

    .value {
      font-size: 14px;
      color: #303133;

      &.highlight {
        font-weight: 500;
        color: #409EFF;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 20px;
  }

  .stat-card {
    text-align: center;
    padding: 16px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #409EFF;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
    }
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .category-tag {
    border-radius: 16px;
    padding: 0 12px;
    height: 24px;
    line-height: 22px;
  }

  .level-tag {
    padding: 0 12px;
    height: 28px;
    line-height: 26px;
    font-weight: 500;
  }

  .empty-value {
    color: #c0c4cc;
    font-style: italic;
  }

  .section-block {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 16px;
      padding-left: 10px;
      border-left: 3px solid #409EFF;
    }
  }

  .percentage-bar {
    display: flex;
    align-items: center;
    gap: 12px;

    .percentage-value {
      min-width: 45px;
      font-size: 14px;
      color: #606266;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #f5f7fa;
      border-radius: 4px;
      overflow: hidden;

      .progress-inner {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;

        &.male {
          background: linear-gradient(to right, #409EFF, #36cfc9);
        }

        &.female {
          background: linear-gradient(to right, #ff9897, #F56C6C);
        }
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .stat-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #409EFF;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
    }
  }
}
</style>
