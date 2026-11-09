var audioEnabled = false
var audioContext = null
var pianoOutput = null
var activeVoices = new Set()
var pianoBuffers = {}
var pianoLoad = null
var pianoReady = false

function updateAudioButton(){
  let label = audioEnabled ? '关闭音频' : '开启音频'
  let title = audioEnabled && !pianoReady
    ? '音频加载中: ' + Object.keys(pianoBuffers).length + '/88，点击关闭音频' : label
  $('#button_audio').attr({'aria-pressed': String(audioEnabled), 'aria-label': label, title: title})
}

function remindAudio(){
  if(!audioEnabled) $('#button_audio svg').addClass('audio_reminder')
}

function initPianoAudio(){
  if(audioContext) return
  audioContext = new AudioContext({latencyHint: 'interactive'})
  pianoOutput = audioContext.createDynamicsCompressor()
  pianoOutput.threshold.value = -18
  pianoOutput.knee.value = 12
  pianoOutput.ratio.value = 8
  pianoOutput.attack.value = 0.003
  pianoOutput.release.value = 0.15
  pianoOutput.connect(audioContext.destination)
}

function loadPianoSamples(){
  if(pianoLoad) return pianoLoad
  let nextKey = 1
  // 限制并发下载；重试时只加载尚未成功解码的琴音。
  async function loadNext(){
    while(nextKey <= 88){
      let key = nextKey++
      if(pianoBuffers[key]) continue
      let response = await fetch('audio/key/' + key + '.mp3', {cache: 'force-cache'})
      if(!response.ok) throw new Error('琴音加载失败: ' + key)
      pianoBuffers[key] = await audioContext.decodeAudioData(await response.arrayBuffer())
      if(audioEnabled){
        updateAudioButton()
      }
    }
  }
  pianoLoad = Promise.allSettled(Array.from({length: 6}, loadNext)).then(function(results){
    if(results.some(result => result.status === 'rejected')){
      pianoLoad = null
      throw new Error('琴音加载失败')
    }
    pianoReady = true
  })
  return pianoLoad
}

function setAudioEnabled(enabled){
  if(enabled){
    try {
      initPianoAudio()
      Promise.all([audioContext.resume(), loadPianoSamples()]).then(function(){
        updateAudioButton()
      }).catch(function(){
        if(!audioEnabled) return
        setAudioEnabled(false)
        showTip('琴音加载或启动失败，请检查网络后重新开启音频', TIP_LEVEL.ERROR)
      })
    } catch(error){
      showTip('音频启动失败，请重新开启音频', TIP_LEVEL.ERROR)
      return
    }
  }
  audioEnabled = enabled
  if(!enabled){
    activeVoices.forEach(function(voice){ voice.stop() })
    activeVoices.clear()
  }
  if(enabled) $('#button_audio svg').removeClass('audio_reminder')
  updateAudioButton()
}
/**
 * 根据曲谱样本播放音频
 * @param sheet
 */
const KEY_STYLE_ON_PLAY_CLASS = 'key_highlight_fix_player'
function playBySheet(sheet) {
  remindAudio()
  let idx = 0
  let item = sheet.data[idx]
  sheet.isPlaying = true
  sheet.playHandler = setInterval(function () {
    $('.' + KEY_STYLE_ON_PLAY_CLASS).removeClass(KEY_STYLE_ON_PLAY_CLASS)
    for (let dataIndex in item){
      let keyNum = item[dataIndex]
      if(keyNum == 0)
        continue
      playByKey(keyNum, false)

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
 * @param remindWhenMuted 静音时是否提醒开启音频；五线谱与曲谱定时播放不提醒
 */
function playByKey(keyNum, remindWhenMuted = true){
  if(remindWhenMuted) remindAudio()
  if(!audioEnabled || !pianoReady || !pianoBuffers[keyNum]) return
  let voice = audioContext.createBufferSource()
  voice.buffer = pianoBuffers[keyNum]
  voice.connect(pianoOutput)
  // 限制连续快速弹奏的声部数量，结束后及时释放节点。
  if(activeVoices.size >= 48){
    let oldest = activeVoices.values().next().value
    oldest.stop()
    activeVoices.delete(oldest)
  }
  activeVoices.add(voice)
  voice.onended = function(){
    activeVoices.delete(voice)
    voice.disconnect()
  }
  voice.start()
}

$(function () {
  $('#button_audio svg').on('animationend', function(){
    $(this).removeClass('audio_reminder')
  })
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


