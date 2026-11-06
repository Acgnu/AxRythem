//音频缓存 key = 琴键号(1-88), value = 音频对象
var AUDIO_CACHE_MAP = {}
var audioEnabled = false

function setAudioEnabled(enabled){
  audioEnabled = enabled
  if(!enabled){
    Object.values(AUDIO_CACHE_MAP).forEach(function(audio){
      audio.pause()
      audio.currentTime = 0
    })
  }
  let label = enabled ? '关闭音频' : '开启音频'
  $('#button_audio').attr({'aria-pressed': String(enabled), 'aria-label': label, title: label})
  $('#status_audio').prop('hidden', enabled)
}
/**
 * 根据曲谱样本播放音频
 * @param sheet
 */
const KEY_STYLE_ON_PLAY_CLASS = 'key_highlight_fix_player'
function playBySheet(sheet) {
  let idx = 0
  let item = sheet.data[idx]
  sheet.isPlaying = true
  sheet.playHandler = setInterval(function () {
    $('.' + KEY_STYLE_ON_PLAY_CLASS).removeClass(KEY_STYLE_ON_PLAY_CLASS)
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
      keyDomJQ.addClass(KEY_STYLE_ON_PLAY_CLASS)
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
  if(!audioEnabled) return
  let audio = AUDIO_CACHE_MAP[keyNum] || (AUDIO_CACHE_MAP[keyNum] = new Audio('audio/key/' + keyNum + '.mp3'))
  audio.currentTime = 0
  audio.play().catch(function(error){
    if(error.name === 'AbortError' || !audioEnabled) return
    setAudioEnabled(false)
    showTip('音频播放失败，请重新开启音频', TIP_LEVEL.ERROR)
  })
}

$(function () {
  $('#button_audio').click(function(){
    setAudioEnabled(!audioEnabled)
  })
//绑定播放样本曲谱按钮
  $('#button_sample_play').click(function(e){
    if(sheet.isPlaying){
      clearInterval(sheet.playHandler)
      sheet.isPlaying = false
      $('.' + KEY_STYLE_ON_PLAY_CLASS).removeClass(KEY_STYLE_ON_PLAY_CLASS)
      return
    }
    playBySheet(sheet)
  })
})


