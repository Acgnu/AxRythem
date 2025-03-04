/**
 * MIDI 输入事件
 * @param type 144=按下 128=抬起
 * @param key MIDI按键号
 * @param volencity  按下速度/力度
 */
var onMidiInput = function (type, key, volencity) {
  let activeKeyClass = 'key_highlight_fix_midi'
  let activeLineClass = 'line_highlight_midi'
  // console.log('type=' + type + 'key=' + key + 'volencity=' + volencity)
  //对应的web键号 = key - 20
  let webKeyNum = key - 20
  //根据键盘号找到对应的键DOM
  let keyboardGroup = getKeyboardGroup(webKeyNum);
  //获取组DOM
  let keyGroupDom = $('.key_group[group-index=' + keyboardGroup.groupIndex + ']')
  let keyDom = keyGroupDom.children()[keyboardGroup.keyInGroupIndex]
  let lineDom = getLineDomByKeyDom(keyDom)
  let keyDomJQ = $(keyDom)
  let lineDomJQ = $(lineDom)
  //按下时点亮
  if(type == 144){
    $('#key-name').text(keyDomJQ.attr('id'))
    playByKey(webKeyNum)
    keyDomJQ.addClass(activeKeyClass)
    lineDomJQ.addClass(activeLineClass)
    onKeyClickWithTrain(keyDom, keyDomJQ.offset().top / 2 + 20,keyDomJQ.offset().left - 16)
  }
  //抬起时熄灭
  if(type == 128){
    keyDomJQ.removeClass(activeKeyClass)
    lineDomJQ.removeClass(activeLineClass)
  }
}

var onMidiSuccess = function (inputDeviceList) {
  $('#midi_device_label').text(inputDeviceList[0])
}