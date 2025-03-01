const  ANIMATE_DOM_ID = 'press_correct_img'
const TRAIN_CLASS_NAME = {
  PRESS_CORRECT_ANI:'press_correct_ani',
  LINE_HIGHLIGHT:'line_highlight',
  START_TRAIN_BUTTON_ACTIVE:'start_train_button_active',
  TRAIN_OP_BUTTON_ACTIVE:'train_op_button_active',
  TRAIN_OPTION_DIV_SHOW_ANI:'train_option_div_show_ani',
  TRAIN_OPTION_DIV_HIDE_ANI:'train_option_div_hide_ani',
  TRAIN_OP_BUTTON_TOP:'train_op_button_top',
}

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
  aniImg.classList.remove(TRAIN_CLASS_NAME.PRESS_CORRECT_ANI);
  // -> triggering reflow /* The actual magic */
  // without this it wouldn't work. Try uncommenting the line and the transition won't be retriggered.
  // This was, from the original tutorial, will no work in strict mode. Thanks Felis Phasma! The next uncommented line is the fix.
  // element.offsetWidth = element.offsetWidth;
  //为了css3动画能够重新播放, 需要这行
  void aniImg.offsetWidth;
  // -> and re-adding the class
  aniImg.classList.add(TRAIN_CLASS_NAME.PRESS_CORRECT_ANI);
}

function onLineTriggerHoverIn(lineDom){
  if(!trainEnv.isTrain){
    //训练模式下, 鼠标悬停到五线谱不显示音名
    let groupIndex = parseInt(lineDom.getAttribute('key-group-index'));
    let lineName = lineDom.getAttribute('line-name');
    let groupElement = $(`.key_group[group-index="${groupIndex + 1}"]`);
    let keyDom = groupElement.find(`[note-name="${lineName}"]`);
    $('#key-name').text(keyDom.attr('id'))
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
      // let groupIndex = parseInt(trainEnv.currentLineDom.getAttribute('key-group-index'));
      // let lineName = trainEnv.currentLineDom.getAttribute('line-name');
      // let groupElement = $(`.key_group[group-index="${groupIndex}"]`);
      // let keyDom = groupElement.find(`[note-name="${lineName}"]`);
      // $('#key-name').text(keyDom.attr('id'))
      // console.log(keyDom.attr('id'))
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
    $(trainEnv.currentLineDom).removeClass(TRAIN_CLASS_NAME.LINE_HIGHLIGHT)
  }
  let minRandomIdx = 0
  let maxRandomIdx = trainEnv.randomAbleLine.length - 1
  let luckyLineIndex = Math.floor(Math.random() * (maxRandomIdx - minRandomIdx + 1)) + minRandomIdx
  trainEnv.currentLineDom = trainEnv.randomAbleLine[luckyLineIndex]
  //获取此线/间对应的键位
  trainEnv.correctKeyDom = getKeyDomByLineDom(trainEnv.randomAbleLine[luckyLineIndex])
  //点亮线/间
  $(trainEnv.currentLineDom).addClass(TRAIN_CLASS_NAME.LINE_HIGHLIGHT)
}

/**
 * 收集可随机的线/间
 * @param trainRange 琴组范围 n-n (1, 7)
 */
function collectTrainLine(trainRange){
  localStorage.setItem('trainRange', trainRange)
  trainEnv.randomAbleLine.length = 0
  // trainEnv.randomAbleLine.splice(0, trainEnv.randomAbleLine.length)
  //获取指定范围的线/间
  $('.line_group').children().each(function (idx, val) {
    let groupIndex = parseInt(val.getAttribute('key-group-index'))
    if (groupIndex > trainRange.split('-')[1] || groupIndex < trainRange.split('-')[0]) {
      return
    }
    trainEnv.randomAbleLine.push(val)
  })
}

$(function () {
  //开始训练按钮点击事件
  $('#button_start_train').click(function (e) {
    trainEnv.isTrain = !trainEnv.isTrain
    let trainOpDiv = $('.train_option_div');
    let trainOpBtn = $('.train_op_button');
    if(!trainEnv.isTrain){
      //停止训练
      if(trainEnv.currentLineDom){
        $(trainEnv.currentLineDom).removeClass(TRAIN_CLASS_NAME.LINE_HIGHLIGHT)
      }
      trainEnv.currentLineDom = null
      trainEnv.correctKeyDom = null
      trainEnv.randomAbleLine = []
      $(this).removeClass(TRAIN_CLASS_NAME.START_TRAIN_BUTTON_ACTIVE)
      trainOpBtn.removeClass(TRAIN_CLASS_NAME.TRAIN_OP_BUTTON_ACTIVE)
      trainOpDiv.removeClass(TRAIN_CLASS_NAME.TRAIN_OPTION_DIV_SHOW_ANI)
      trainOpDiv.addClass(TRAIN_CLASS_NAME.TRAIN_OPTION_DIV_HIDE_ANI)
      return
    }
    let trainRange = localStorage.getItem('trainRange');
    if(!trainRange || trainRange == '2-5'){
      trainRange = '2-5'
      trainOpBtn[0].classList.add(TRAIN_CLASS_NAME.TRAIN_OP_BUTTON_ACTIVE)
    } else {
      trainOpBtn[1].classList.add(TRAIN_CLASS_NAME.TRAIN_OP_BUTTON_ACTIVE)
    }
    collectTrainLine(trainRange)
    $(this).addClass(TRAIN_CLASS_NAME.START_TRAIN_BUTTON_ACTIVE)
    trainOpDiv.addClass(TRAIN_CLASS_NAME.TRAIN_OPTION_DIV_SHOW_ANI)
    trainOpDiv.removeClass(TRAIN_CLASS_NAME.TRAIN_OPTION_DIV_HIDE_ANI)
    reRandomTrainLine()
  })

  //切换训练范围
  $('.train_op_button').click(function (e) {
    let me = $(this)
    if(me.hasClass(TRAIN_CLASS_NAME.TRAIN_OP_BUTTON_ACTIVE)){
      return;
    }
    me.parent().children().removeClass(TRAIN_CLASS_NAME.TRAIN_OP_BUTTON_ACTIVE)
    me.addClass(TRAIN_CLASS_NAME.TRAIN_OP_BUTTON_ACTIVE)
    if(me.hasClass(TRAIN_CLASS_NAME.TRAIN_OP_BUTTON_TOP)){
      collectTrainLine('2-5')
      reRandomTrainLine()
      return
    }
    collectTrainLine('1-7')
    reRandomTrainLine()
  })
})