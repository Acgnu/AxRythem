function showTip(msg, level) {
  let levelColor = {
    'error':'#e13030',
    'normal':'',
    'warning':''
  }
  let divTipJQ = $('#div_tip')
  divTipJQ.text(msg)
  divTipJQ.css({background:levelColor[level], left:$(window).width() / 2 - divTipJQ.width() / 2})
  let aniDiv = document.getElementById('div_tip');
  aniDiv.classList.remove('div_tip_ani');
  void aniDiv.offsetWidth;
  aniDiv.classList.add('div_tip_ani');
}