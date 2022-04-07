//页面复音下标, 自增作为节点ID
var footageIndex = 1
//每个复音需要按下的琴键节点
var activeKeyList = []
//所有复音集合
var keyFootages = {}
var storageKey = 'polyphony'

$(function () {
  //禁用浏览器默认右键菜单
  document.oncontextmenu = function (e) {
    e.preventDefault()
    deactiveAllKey()
    $('.footage_active').removeClass('footage_active')
  }
  //监听键盘按下事件
  document.body.onkeydown = function (e) {
    //左键播放当前选中复音的左边一个复音
    if('ArrowLeft' == e.key){
      $('.footage_active').prev().trigger('click')
    }
    if('ArrowRight' ==  e.key){
      $('.footage_active').next().trigger('click')
    }
  }

  //从存储中恢复复音
  recoverPolyphony()

  //复音创建事件
  $('#button_create_footage').click(function(e){
    if(activeKeyList.length == 0) return
    $('#footage_list').children().removeClass('footage_active')
    let dom = '<div class="footage_item footage_active" footage-index="' + footageIndex + '">'
    dom += '<div class="footage_remove">-</div>'
    dom += '<p>复音' + footageIndex + '</p>'
    dom += '</div>'
    $('#footage_list').append(dom)
    let activeKeyCopy = []
    for(let i = 0; i < activeKeyList.length; i++){
      activeKeyCopy.push(activeKeyList[i])
    }
    keyFootages[footageIndex++] = activeKeyCopy
    savePolyphony()
  })

  //绑定复音点击事件
  $("#footage_list").delegate(".footage_item","click",function(e){
    //如果已选中, 则取消选中
    deactiveAllKey()
    let _me = $(this)
    if(_me.hasClass('footage_active')){
      _me.removeClass('footage_active')
      return
    }
    _me.parent().children().removeClass('footage_active')
    _me.addClass('footage_active')
    let domList = keyFootages[e.target.getAttribute('footage-index')]
    for(let i = 0; i < domList.length; i++){
      activeKeyList.push(domList[i])
      $(domList[i]).addClass('key_highlight_fix');
      let keyNum = getKeyNumByKeyDom(domList[i])
      playByKey(keyNum)
    }
  });

  //绑定移除单个复音按钮点击事件
  $("#footage_list").delegate(".footage_remove","click",function(e){
    e.stopPropagation()
    let _me = $(this)
    if(_me.parent().hasClass('footage_active')){
      deactiveAllKey()
    }
    _me.parent().remove()
    delete keyFootages[e.target.parentElement.getAttribute('footage-index')]
    removePolyphony(e.target.parentElement.getAttribute('footage-index') - 1)
  });

  //绑定移除所有复音按钮点击事件
  $('#button_footage_remove_all').click(function(e){
    $('#footage_list').children().remove()
    deactiveAllKey()
    footageIndex = 1
    keyFootages = {}
    removePolyphony()
  })
})

/**
 * 取消所有键位选中状态
 */
function deactiveAllKey(){
  $('.key_highlight_fix').removeClass('key_highlight_fix')
  activeKeyList = []
}

/**
 * 线点击事件
 * @param {} keyDom 
 * @returns 
 */
function onLineTriggerClick(keyDom) {
  if(keyDom){
    if($(keyDom).hasClass('key_highlight_fix')) return
    $(keyDom).addClass('key_highlight_fix')
    activeKeyList.push(keyDom)
    playByKey(getKeyNumByKeyDom(keyDom))
  }
}

/**
 * 恢复所有复音组
 */
function recoverPolyphony() {
  let p = localStorage.getItem(storageKey)
  if(p) {
    let pObj = JSON.parse(p)
    for(let o in pObj) {
      let pkeys = pObj[o]
      let activeKeyDoms = []
      for(let ki in pkeys) {
        let keyIdxInfo = pkeys[ki]
        let keyGroupDom = $('.key_group[group-index=' + keyIdxInfo.gi + ']')
        let keyDom = keyGroupDom.children()[keyIdxInfo.ki]
        activeKeyDoms.push(keyDom)
      }
      let dom = '<div class="footage_item" footage-index="' + footageIndex + '">'
      dom += '<div class="footage_remove">-</div>'
      dom += '<p>复音' + footageIndex + '</p>'
      dom += '</div>'
      $('#footage_list').append(dom)
      keyFootages[footageIndex++] = activeKeyDoms
    }
  }
}

/**
 * 删除复音存储, 可指定下标
 * @param {*} idx 需要删除的下标, 不指定删除全部
 * @returns 
 */
function removePolyphony(idx) {
  if(typeof idx != 'undefined') {
    let ds = localStorage.getItem(storageKey)
    if(!ds) return
    let data = JSON.parse(ds)
    if(data && data.length > idx) {
      data.splice(idx,1); 
      localStorage.setItem(storageKey, JSON.stringify(data))
    }
  } else {
    localStorage.removeItem(storageKey)
  }
}

/**
 * 保存复音
 */
function savePolyphony() {
  //复音总对象, 转换成数组
  let data = []
  for(let idx in keyFootages) {
    let keymap = keyFootages[idx]
    let subData = []
    let subKey = {}
    for(let ki in keymap) {
      let keyGroupIndex = keymap[ki].parentElement.getAttribute('group-index')
      let keyIndex = 0
      let pChild = keymap[ki].parentElement.children
      for(var i = 0; i< pChild.length; i++){
        if(pChild[i] == keymap[ki]){
          keyIndex = i;
          break;
        }
      }
      //保存键位组下标和键位下标
      subKey = {
        gi:parseInt(keyGroupIndex),
        ki:keyIndex
      }
      subData.push(subKey)
    }
    data.push(subData)
  }
  if(data.length > 0) {
    localStorage.setItem(storageKey, JSON.stringify(data))
  }
}