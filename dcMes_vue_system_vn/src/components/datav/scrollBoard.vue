<template>
  <div id="scroll-board">
    <dv-scroll-board :config="config" />
  </div>
</template>

<script>
export default {
  name: 'ScrollBoard',
  data () {
    return {
      config: {
        header: ['時間', '消費信息', '用戶', '消費類型'],
        data: [
          ['2019-07-01 19:25:00', '消費50Q', '用戶1', '消費'],
          ['2019-07-02 17:25:00', '充值150Q', '用戶113', '充值'],
          ['2019-07-03 16:25:00', '消費50Q', '用戶16', '消費'],
          ['2019-07-04 15:25:00', '充值150Q', '用戶12', '充值'],
          ['2019-07-05 14:25:00', '消費50Q', '用戶11', '消費'],
          ['2019-07-06 13:25:00', '消費50Q', '用戶13', '消費'],
          ['2019-07-07 12:25:00', '充值150Q', '用戶14', '充值'],
          ['2019-07-08 11:25:00', '消費50Q', '用戶12', '消費'],
          ['2019-07-09 10:25:00', '消費50Q', '用戶15', '消費'],
          ['2019-07-10 09:25:00', '消費50Q', '用戶13', '消費']
        ],
        index: true,
        columnWidth: [50,180,150],
        align: ['center'],
        rowNum: 7,
        headerBGC: '#1981f6',
        headerHeight: 45,
        oddRowBGC: 'rgba(0, 44, 81, 0.8)',
        evenRowBGC: 'rgba(10, 29, 50, 0.8)'
      }
    }
  }
}
</script>

<style lang="less">
#scroll-board {
  width: 50%;
  box-sizing: border-box;
  margin-left: 20px;
  height: 100%;
  overflow: hidden;
}
</style>
