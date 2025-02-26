<template>
  <div id="ranking-board">
    <div class="ranking-board-title">職位數排行</div>
    <dv-scroll-ranking-board :config="config" />
  </div>
</template>

<script>
export default {
  name: 'RankingBoard',
  data () {
    return {
      config: {
        data: [
          {
            name: 'Java',
            value: 55
          },
          {
            name: 'C++',
            value: 120
          },
          {
            name: '高級管理',
            value: 78
          },
          {
            name: '護工',
            value: 66
          },
          {
            name: '计日工',
            value: 80
          },
          {
            name: 'C#',
            value: 45
          },
          {
            name: '教師職工',
            value: 29
          },
          {
            name: '服務員',
            value: 29
          },
          {
            name: '绿化人員',
            value: 29
          },
					{
					  name: '绿化人員',
					  value: 888
					}
        ],
        rowNum: 9
      }
    }
  }
}
</script>

<style lang="less">
#ranking-board {
  width: 20%;
	height: 73vh;
  box-shadow: 0 0 3px blue;
  display: flex;
  flex-direction: column;
  background-color: rgba(6, 30, 93, 0.5);
  border-top: 2px solid rgba(1, 153, 209, .5);
  box-sizing: border-box;
  padding: 0px 30px;

  .ranking-board-title {
    font-weight: bold;
    height: 50px;
    display: flex;
    align-items: center;
    font-size: 20px;
  }

  .dv-scroll-ranking-board {
    flex: 1;
  }
}
</style>
