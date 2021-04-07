//音频缓存 key = 琴键号(1-88), value = 音频对象
var AUDIO_CACHE_MAP = {}
/**
 * 根据曲谱样本播放音频
 * @param sheet
 */
function playBySheet(sheet) {
  let activeKeyClass = 'key_highlight_fix_player'
  let idx = 0
  let item = sheet.data[idx]
  sheet.isPlaying = true
  sheet.playHandler = setInterval(function () {
    $('.' + activeKeyClass).removeClass(activeKeyClass)
    for (let dataIndex in item){
      let keyNum = item[dataIndex]
      if(keyNum == 0)
        continue
      playByKey(keyNum)

      let keyboardGroup = getKeyboardGroup(keyNum);
      //获取组DOM
      let keyGroupDom = $('.key_group[group-index=' + keyboardGroup.groupIndex + ']')
      let keyDom = keyGroupDom.children()[keyboardGroup.keyInGroupIndex]
      let keyDomJQ = $(keyDom)
      keyDomJQ.addClass(activeKeyClass)
    }

    if(idx + 1 < sheet.data.length){
      item = sheet.data[++idx]
    } else if (sheet.loop) {
      idx = 0
    } else {
      clearInterval(sheet.playHandler)
      sheet.isPlaying = false
    }
  }, sheet.rythem)
}

/**
 * 根据键位号播放对应的音频(音调)
 * @param keyNum (1-88)
 */
function playByKey(keyNum){
  if(AUDIO_CACHE_MAP[keyNum]){
    AUDIO_CACHE_MAP[keyNum].currentTime = 0
    AUDIO_CACHE_MAP[keyNum].play()
    return
  }
  let audio = new Audio('audio/key/' + keyNum + '.mp3')
  audio.play()
  if(audio.paused){
    showTip('Audio can not play before you click anywhere of this page', TIP_LEVEL.ERROR)
  }else{
    AUDIO_CACHE_MAP[keyNum] = audio
  }
}

$(function () {
//绑定播放样本曲谱按钮
  $('#button_sample_play').click(function(e){
    if(sheet.isPlaying){
      clearInterval(sheet.playHandler)
      sheet.isPlaying = false
      return
    }
    playBySheet(sheet)
  })
})


