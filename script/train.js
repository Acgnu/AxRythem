const  ANIMATE_DOM_ID = 'press_correct_img'
const TRAIN_NOTE_MARKER_ID = 'train_note_marker'
const TRAIN_CLASS_NAME = {
  PRESS_CORRECT_ANI:'press_correct_ani',
  LINE_HIGHLIGHT:'line_highlight',
  START_TRAIN_BUTTON_ACTIVE:'start_train_button_active',
  TRAIN_OP_BUTTON_ACTIVE:'train_op_button_active',
  TRAIN_OPTION_DIV_SHOW_ANI:'train_option_div_show_ani',
  TRAIN_OPTION_DIV_HIDE_ANI:'train_option_div_hide_ani',
  TRAIN_OP_BUTTON_TOP:'train_op_button_top',
  //训练模式标记, 挂在五线谱容器上, 用于隐藏所有加线
  LINE_GROUP_TRAIN:'line_group_train',
  //谱表外的加线(含中央C虚线), 训练模式下按需显示
  LINE_LEDGER_VISIBLE:'line_ledger_visible',
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

function getTrainNoteMarker() {
  let marker = $('#' + TRAIN_NOTE_MARKER_ID)
  if(!marker.length){
    marker = $('<span id="' + TRAIN_NOTE_MARKER_ID + '" class="train_note_marker" aria-hidden="true">♪</span>')
    $('.line_group').append(marker)
    alignTrainNoteHead(marker[0])
  }
  return marker
}

function alignTrainNoteHead(marker) {
  const style = getComputedStyle(marker)
  const size = parseFloat(style.fontSize)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.ceil(size * 3)
  const context = canvas.getContext('2d')
  context.font = style.fontSize + ' ' + style.fontFamily
  const metrics = context.measureText(marker.textContent)
  context.fillText(marker.textContent, size, size * 2)

  // The lower half of this glyph contains the notehead and the narrow stem.
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const firstRow = Math.floor(size * 2 + (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2)
  const rows = []
  for(let y = firstRow; y < canvas.height; y++){
    let width = 0
    for(let x = 0; x < canvas.width; x++){
      if(pixels[(y * canvas.width + x) * 4 + 3] > 127){
        width++
      }
    }
    rows.push({y, width})
  }
  const maxWidth = Math.max(...rows.map(row => row.width))
  const headRows = rows.filter(row => row.width > maxWidth / 2)
  if(!headRows.length){
    return
  }
  const headCenter = (headRows[0].y + headRows[headRows.length - 1].y + 1) / 2

  // A zero-height inline box exposes the actual text baseline, including font fallback.
  const baseline = document.createElement('span')
  baseline.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
  marker.appendChild(baseline)
  const baselineOffset = baseline.getBoundingClientRect().top - marker.getBoundingClientRect().top
  baseline.remove()
  marker.style.setProperty('--train-note-offset', -(baselineOffset + headCenter - size * 2) + 'px')
}

function showTrainNoteMarker(lineDom) {
  if(!lineDom){
    return
  }
  let lineGroupDom = $('.line_group')[0]
  let lineRect = lineDom.getBoundingClientRect()
  let lineGroupRect = lineGroupDom.getBoundingClientRect()
  let markerTop = lineRect.top - lineGroupRect.top + lineRect.height / 2
  getTrainNoteMarker().css('top', markerTop).addClass('is_visible')
}

function hideTrainNoteMarker() {
  $('#' + TRAIN_NOTE_MARKER_ID).removeClass('is_visible')
}

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

function onLineTriggerHoverIn(keyDom){
  //训练模式下, 鼠标悬停到五线谱不显示音名
  if(!trainEnv.isTrain){
    $('#key-name').text(keyDom.getAttribute('note-name'))
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
      $('#key-name').text(keyDom.getAttribute('note-name'))
      //如果按对了, 消除上一个线/间, 重新开始生成随机线/间
      reRandomTrainLine()
      //显示动画
      playCorrectAnimation(offsetT,offsetL)
    }
  }
}

/**
 * 五线谱关键位置, 数值为节点的 staff-index (52在最上, 1在最下)
 * 上加线自34向上, 下加线自14向下, 24是谱表中间的中央C虚线
 * @type {{TOP_LINE: number, BOTTOM_LINE: number, CENTER_LINE: number}}
 */
const TRAIN_STAFF_BOUND = {TOP_LINE:34, BOTTOM_LINE:14, CENTER_LINE:24}

/**
 * 计算谱面位置对应的加线信息
 * @param staffIndex 谱面位置
 * @returns {{side: string, ring: number}} side: up上加线 down下加线 center中央C, ring: 从谱表向外第几条, 0表示无需加线
 */
function getLedgerInfo(staffIndex) {
  //谱表中间的中央C线, 只有正好落在该线上的音符才需要
  if(TRAIN_STAFF_BOUND.CENTER_LINE == staffIndex){
    return {side:'center', ring:1}
  }
  if(staffIndex > TRAIN_STAFF_BOUND.TOP_LINE){
    return {side:'up', ring:Math.floor((staffIndex - TRAIN_STAFF_BOUND.TOP_LINE) / 2)}
  }
  if(staffIndex < TRAIN_STAFF_BOUND.BOTTOM_LINE){
    return {side:'down', ring:Math.floor((TRAIN_STAFF_BOUND.BOTTOM_LINE - staffIndex) / 2)}
  }
  return {side:'', ring:0}
}

/**
 * 显示训练音符所在的加线, 同时显示该加线到谱表之间的所有加线
 * 例如命中上加3线时, 上加1线, 2线一起显示
 * @param lineDom 训练音符所在的线/间
 */
function revealTrainLedger(lineDom) {
  let lineGroup = $('.line_group')
  lineGroup.children('.' + TRAIN_CLASS_NAME.LINE_LEDGER_VISIBLE).removeClass(TRAIN_CLASS_NAME.LINE_LEDGER_VISIBLE)
  if(!lineDom){
    return
  }
  let targetInfo = getLedgerInfo(parseInt(lineDom.getAttribute('staff-index')))
  if(targetInfo.ring <= 0){
    return
  }
  lineGroup.children('.line_ledger').each(function (idx, val) {
    let eachInfo = getLedgerInfo(parseInt(val.getAttribute('staff-index')))
    if(eachInfo.side == targetInfo.side && eachInfo.ring <= targetInfo.ring){
      $(val).addClass(TRAIN_CLASS_NAME.LINE_LEDGER_VISIBLE)
    }
  })
}

/**
 * 隐藏所有加线
 */
function hideAllTrainLedger() {
  $('.line_group').children('.' + TRAIN_CLASS_NAME.LINE_LEDGER_VISIBLE).removeClass(TRAIN_CLASS_NAME.LINE_LEDGER_VISIBLE)
}

/**
 * 重新生成随机五线谱选中线
 */
function reRandomTrainLine() {
  let candidates = trainEnv.randomAbleLine.filter(line => line !== trainEnv.currentLineDom)
  if(!candidates.length){
    candidates = trainEnv.randomAbleLine
  }
  if(!candidates.length){
    trainEnv.currentLineDom = null
    trainEnv.correctKeyDom = null
    hideTrainNoteMarker()
    hideAllTrainLedger()
    return
  }
  let luckyLineIndex = Math.floor(Math.random() * candidates.length)
  trainEnv.currentLineDom = candidates[luckyLineIndex]
  //获取此线/间对应的键位
  trainEnv.correctKeyDom = getKeyDomByLineDom(trainEnv.currentLineDom)
  // 在选中线/间的中心显示音符
  showTrainNoteMarker(trainEnv.currentLineDom)
  //显示训练音符所在的加线
  revealTrainLedger(trainEnv.currentLineDom)
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
  $('.line_group').children('.line_triggler').each(function (idx, val) {
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
        hideTrainNoteMarker()
      }
      trainEnv.currentLineDom = null
      trainEnv.correctKeyDom = null
      trainEnv.randomAbleLine = []
      //恢复显示所有加线
      $('.line_group').removeClass(TRAIN_CLASS_NAME.LINE_GROUP_TRAIN)
      hideAllTrainLedger()
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
    //训练模式下隐藏所有加线
    $('.line_group').addClass(TRAIN_CLASS_NAME.LINE_GROUP_TRAIN)
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

  $(window).resize(function () {
    if(trainEnv.isTrain){
      showTrainNoteMarker(trainEnv.currentLineDom)
    }
  })
})
