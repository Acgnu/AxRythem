//页面片段下标, 自增作为节点ID
var footageIndex = 1
//每个片段需要按下的琴键节点
var activeKeyList = []
//所有片段集合
var keyFootages = {}

$(function () {
  //禁用浏览器默认右键菜单
  document.oncontextmenu = function (e) {
    e.preventDefault()
    deactiveAllKey()
    $('.footage_active').removeClass('footage_active')
  }
  //监听键盘按下事件
  document.body.onkeydown = function (e) {
    //左键播放当前选中片段的左边一个片段
    if('ArrowLeft' == e.key){
      $('.footage_active').prev().trigger('click')
    }
    if('ArrowRight' ==  e.key){
      $('.footage_active').next().trigger('click')
    }
  }

  //片段创建事件
  $('#button_create_footage').click(function(e){
    if(activeKeyList.length == 0) return
    $('#footage_list').children().removeClass('footage_active')
    let dom = '<div class="footage_item footage_active" footage-index="' + footageIndex + '">'
    dom += '<div class="footage_remove">-</div>'
    dom += '<p>片段' + footageIndex + '</p>'
    dom += '</div>'
    $('#footage_list').append(dom)
    let activeKeyCopy = []
    for(let i = 0; i < activeKeyList.length; i++){
      activeKeyCopy.push(activeKeyList[i])
    }
    keyFootages[footageIndex++] = activeKeyCopy
  })

  //绑定片段点击事件
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

  //绑定移除单个片段按钮点击事件
  $("#footage_list").delegate(".footage_remove","click",function(e){
    e.stopPropagation()
    let _me = $(this)
    if(_me.parent().hasClass('footage_active')){
      deactiveAllKey()
    }
    _me.parent().remove()
    delete keyFootages[e.target.parentElement.getAttribute('footage-index')]
  });

  //绑定移除所有片段按钮点击事件
  $('#button_footage_remove_all').click(function(e){
    $('#footage_list').children().remove()
    deactiveAllKey()
    footageIndex = 1
    keyFootages = {}
  })
})

/**
 * 取消所有键位选中状态
 */
function deactiveAllKey(){
  $('.key_highlight_fix').removeClass('key_highlight_fix')
  activeKeyList = []
}

function onLineTriggerClick(keyDom) {
  if(keyDom){
    if($(keyDom).hasClass('key_highlight_fix')) return
    $(keyDom).addClass('key_highlight_fix')
    activeKeyList.push(keyDom)
    playByKey(getKeyNumByKeyDom(keyDom))
  }
}