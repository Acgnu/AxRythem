var  ANIMATE_DOM_ID = 'press_correct_img'
var  ANIMATE_CLASS_NAME = 'press_correct_ani'
var TRAIN_LINE_HIGHLIGHT_CLASS_NAME = 'line_highlight'
var TRAIN_BUTTON_ACTIVE_CLASS_NAME = 'start_train_button_active'
/**
 * 训练模式存储变量
 * @type {{
 * currentLineDom: null, 随机五线谱对应的线间节点
 * correctKeyDom: null, 随机五线谱对应正确的琴键
 * randomAbleLine: [], 可供随机点亮五线谱的范围
 * isTrain: boolean  标识当前是否处于训练模式 true 是
 * }}
 */
var trainEnv = {isTrain:false, randomAbleLine:[], currentLineDom:null, correctKeyDom:null}

/**
 * 播放按键正确动画
 * @param offsetT
 * @param offsetL
 */
function playCorrectAnimation(offsetT, offsetL) {
  $('#' + ANIMATE_DOM_ID).css({top: offsetT, left: offsetL})
  var aniImg = document.getElementById(ANIMATE_DOM_ID);
  aniImg.classList.remove(ANIMATE_CLASS_NAME);
  // -> triggering reflow /* The actual magic */
  // without this it wouldn't work. Try uncommenting the line and the transition won't be retriggered.
  // This was, from the original tutorial, will no work in strict mode. Thanks Felis Phasma! The next uncommented line is the fix.
  // element.offsetWidth = element.offsetWidth;
  //为了css3动画能够重新播放, 需要这行
  void aniImg.offsetWidth;
  // -> and re-adding the class
  aniImg.classList.add(ANIMATE_CLASS_NAME);
}

function onLineTriggerHoverIn(lineDom){
  if(!trainEnv.isTrain){
    //训练模式下, 鼠标悬停到五线谱不显示音名
    $('#key-name').text(lineDom.getAttribute('line-name'))
  }
}

function onDiaoHaoChange() {
  //如果处于训练模式, 重新随机
  if(trainEnv.isTrain){
    $('#button_start_train').trigger('click')
    $('#button_start_train').trigger('click')
  }
}

function onKeyClickWithTrain(keyDom, offsetT, offsetL) {
  if(trainEnv.isTrain){
    //训练模式
    if(keyDom == trainEnv.correctKeyDom){
      $('#key-name').text(trainEnv.currentLineDom.getAttribute('line-name'))
      //如果按对了, 消除上一个线/间, 重新开始生成随机线/间
      reRandomTrainLine()
      //显示动画
      playCorrectAnimation(offsetT,offsetL)
    }
  }
}

/**
 * 重新生成随机五线谱选中线
 */
function reRandomTrainLine() {
  if(trainEnv.currentLineDom){
    $(trainEnv.currentLineDom).removeClass(TRAIN_LINE_HIGHLIGHT_CLASS_NAME)
  }
  let minRandomIdx = 0
  let maxRandomIdx = trainEnv.randomAbleLine.length - 1
  let luckyLineIndex = Math.floor(Math.random() * (maxRandomIdx - minRandomIdx + 1)) + minRandomIdx
  trainEnv.currentLineDom = trainEnv.randomAbleLine[luckyLineIndex]
  //获取此线/间对应的键位
  trainEnv.correctKeyDom = getKeyDomByLineDom(trainEnv.randomAbleLine[luckyLineIndex])
  //点亮线/间
  $(trainEnv.currentLineDom).addClass(TRAIN_LINE_HIGHLIGHT_CLASS_NAME)
}

$(function () {
  //开始训练按钮点击事件
  $('#button_start_train').click(function (e) {
    trainEnv.isTrain = !trainEnv.isTrain
    if(!trainEnv.isTrain){
      //停止训练
      if(trainEnv.currentLineDom){
        $(trainEnv.currentLineDom).removeClass(TRAIN_LINE_HIGHLIGHT_CLASS_NAME)
      }
      trainEnv.currentLineDom = null
      trainEnv.correctKeyDom = null
      trainEnv.randomAbleLine = []
      $(this).removeClass(TRAIN_BUTTON_ACTIVE_CLASS_NAME)
      return
    }
    $(this).addClass(TRAIN_BUTTON_ACTIVE_CLASS_NAME)
    let startGroupIndex = 2
    let endGroupIndex = 5
    //获取指定范围的线/间
    $('.line_group').children().each(function (idx, val) {
      let groupIndex = parseInt(val.getAttribute('key-group-index'))
      if (groupIndex > endGroupIndex || groupIndex < startGroupIndex) {
        return
      }
      trainEnv.randomAbleLine.push(val)
    })
    reRandomTrainLine()
  })
})