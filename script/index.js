/**
 * 琴键分组信息, 对应钢琴分组(大字一组二组, 小字组....)
 * @type {({
 * maxKey: number, 当前组最大琴键号
 * minKey: number, 当前组最小琴键号
 * index: number 当前组下标
 * })[]}
 */
const groupInfo = [
    {index: 1, minKey: 1, maxKey: 3},
    {index: 2, minKey: 4, maxKey: 15},
    {index: 3, minKey: 16, maxKey: 27},
    {index: 4, minKey: 28, maxKey: 39},
    {index: 5, minKey: 40, maxKey: 51},
    {index: 6, minKey: 52, maxKey: 63},
    {index: 7, minKey: 64, maxKey: 75},
    {index: 8, minKey: 76, maxKey: 87},
    {index: 9, minKey: 88, maxKey: 88},
];

//调号信息
const keyDiao = {
    diaoHao: 'C',       //当前使用的调号
    diaoPkg: {
        //C大调就是C D E F G A B C，符合十二平均律中大调的基本规律即全全半全全全半，C大调中既没有升调也没有降调。
        C: {desc:'C大调', blackKeys: [], offset: 0},
        //G大调就是G A B C D E #F，这里的G大调一定要有#F（升F），这样才能形成大调中的全全半全全全半的规律。
        G: {desc:'G大调',blackKeys: ['F'], offset: 1},
        //D大调就是D E #F G A B #C D，这里的D大调一定要有#F和 #C（升F和升C）。
        D: {desc:'D大调', blackKeys: ['F', 'C'], offset: 1},
        //A大调就是A B #C D E #F # G A，这个大调有三个升号#F、 #C和# G。
        A: {desc:'A大调', blackKeys: ['F', 'C', 'G'], offset: 1},
        //E大调就是E #F #G A B #C #D E，这个大调有四个升号#F、 #C、# G和#D。
        E: {desc:'E大调', blackKeys: ['F', 'C', 'G', 'D'], offset: 1},
        //B大调就是B #C #D E #F #G #A B，这个大调有五个升号#F、 #C、# G、#D和#A。
        B: {desc:'B大调', blackKeys: ['F', 'C', 'G', 'A', 'D'], offset: 1},
        uF: {desc:'升F大调', blackKeys: ['F', 'C', 'G', 'D', 'A', 'E'], offset: 1},
        uC: {desc:'升C大调', blackKeys: ['F', 'C', 'G', 'D', 'A', 'E', 'B'], offset: 1},
        //F大调就是F G A bB C D E F，这里的F大调一定要bB（降B），这样才能符合大调中的全全半全全全半的规律。
        F: {desc:'F大调',blackKeys: ['B'], offset: -1},
        //bB大调就是bB C D bE F G A bB，这个大调有两个降号bB和bE。
        bB: {desc:'降B大调', blackKeys: ['B', 'E'], offset: -1},
        //bE大调就是bE F G bA bB C D bE，这个大调有三个降号bB、bE和bA。
        bE: {desc:'降E大调', blackKeys: ['B', 'E', 'A'], offset: -1},
        //bA大调就是bA bB C bD bE F G bA，这个大调有四个降号bB、bE、bA和bD。
        bA: {desc:'降A大调', blackKeys: ['B', 'E', 'A', 'D'], offset: -1},
        //bD大调就是bD bE F bG bA bB C bD，这个大调有五个降号bB、bE、bA、bD和bG。
        bD:{desc:'降D大调', blackKeys: ['B', 'E', 'A', 'D', 'G'], offset: -1},
        // bG大调就是bG bA bB bC bD bE F bG，这个大调有六个降号bB、bE、bA、bD、bG和bC。
        bG: {desc:'降G大调', blackKeys: ['B', 'E', 'A', 'D', 'G', 'C'], offset: -1},
        bC: {desc:'降C大调', blackKeys: ['F', 'C', 'G', 'D', 'A', 'E', 'B'], offset: -1},
    },
    //根据输入的键(A, B, C), 根据调号判断需要升还是降
    getKeyOffset: function (key) {
        let diaoInfo = this.diaoPkg[this.diaoHao]
        if (diaoInfo.blackKeys.indexOf(key) >= 0) {
            return diaoInfo.offset
        }
        return 0
    },
    //变更当前调号
    setDiaoHao: function (diaoHao) {
        this.diaoHao = diaoHao
        showTip(this.diaoPkg[diaoHao].desc, TIP_LEVEL.NORMAL)
    }
}

const TIP_LEVEL = {
    ERROR:{bgColor:'#e13030', bdColor:'#ffa9a9'},
    NORMAL:{bgColor:'#8ec88b', bdColor:'#adffc2'},
    WARNING:{bgColor:'#bcb65d', bdColor:'#fdff87'}
}
/**
 * 根据键位总下标, 获取在其所属分组的下标
 * @param index  键盘号
 * @param group 键盘号所在组
 * @returns {number}
 */
function getKeyInGroupIndex(index, group) {
    let x = 0;
    for(let i = group.minKey; i <= group.maxKey; i++){
        if(i == index){
            return x;
        }
        x++;
    }
}

/**
 * 根据键位总下标, 获取其所属分组以及其他关联信息
 * @param index  键盘号
 * @returns {{maxKey: number, minKey: number, groupIndex: number, keyInGroupIndex: number, key: *}}
 */
function getKeyboardGroup(index){
    for(let i = 0; i < groupInfo.length; i++){
        let group = groupInfo[i]
        if(index <= group.maxKey && index >= group.minKey){
            return {
                key:index,
                groupIndex:group.index,
                keyInGroupIndex:getKeyInGroupIndex(index, group),
                minKey:group.minKey,
                maxKey:group.maxKey
            }
        }
    }
}

/**
 * 根据键名以及其所属分组, 获取移调后的键位
 * @param keyName 键位名(A, B, C...)
 * @param group 键所在分组
 * @returns {number}  键位偏移量
 */
function getKeyIndex(keyName, group){
    if('C' == keyName){
        return group.minKey + keyDiao.getKeyOffset(keyName)
    }
    if('D' == keyName){
        return group.minKey + 2 + keyDiao.getKeyOffset(keyName)
    }
    if('E' == keyName){
        return group.minKey  + 4 +  keyDiao.getKeyOffset(keyName)
    }
    if('F' == keyName){
        return group.minKey  + 5 +  keyDiao.getKeyOffset(keyName)
    }
    if('G' == keyName){
        if(group.index == 1){
            return 1 +  keyDiao.getKeyOffset(keyName);
        }
        return group.minKey  + 7 +  keyDiao.getKeyOffset(keyName)
    }
    if('A' == keyName){
        if(group.index == 1){
            return 2 +  keyDiao.getKeyOffset(keyName);
        }
        return group.minKey  + 9 +  keyDiao.getKeyOffset(keyName)
    }
    if('B' == keyName){
        return group.maxKey +  keyDiao.getKeyOffset(keyName)
    }
}

$(function () {
    if(navigator.userAgent.indexOf('Chrome') < 0){
        showTip('Use Chrome for the best experience', TIP_LEVEL.WARNING)
    }

    //恢复选择的主题
    let choosedTheme = localStorage.getItem('theme')
    changeTheme(choosedTheme ? choosedTheme : 'css/skin.default.css')

    //生成五线谱节点
    let lineGroup = $('.line_group')
    let isDiv = false
    let keyNameIndex = 0;
    let keyNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    let currentGroup = 9;
    //0-53号键位(标准五线)以外用半透明线表示
    for(let i = 53; i > 0; i--){
        let dom;
        if(isDiv){
            dom= document.createElement("div");
            isDiv = false
        } else {
            dom = document.createElement('hr');
            isDiv = true
        }
        dom.className = "line_triggler"
        if(i == 25){
            //中央C用虚线表示
            dom.style.borderStyle = 'dashed'
        }
        //根据调号定位到具体键
        let lineName = keyNames[keyNameIndex--]
        dom.setAttribute('line-name', lineName)
        dom.setAttribute('key-group-index', currentGroup - 1)
        if(keyNameIndex < 0){
            keyNameIndex = 6
            currentGroup--;
        }
        if((i < 15 || i > 35) && isDiv){
            // dom.style.borderColor = '#FFFFFF';
            dom.style.borderColor = '#b1b1b1';
        }
        lineGroup.append(dom)
    }

    //创建调号修改面板
    let diaoPanel = $('.diao_panel')
    let activeClass = 'diao_panel_active'
    for(let diao in keyDiao.diaoPkg){
        let diaoName = diao
        let diaoDomHTML = '<li diao-name="' + diaoName + '" class="' + activeClass + '">'
        diaoDomHTML += '<img src="imgs/diaohao/' + diaoName + '.png" title="' + keyDiao.diaoPkg[diao].desc + '"/>'
        diaoDomHTML += '</li>'
        diaoPanel.append(diaoDomHTML)
        activeClass = ''
    }

    //绑定五线谱鼠标悬停事件
    let keyDom;
    $('.line_triggler').hover(function(e) {
        keyDom = getKeyDomByLineDom(e.target)
        $(keyDom).addClass('key_highlight');
        onLineTriggerHoverIn(e.target)
    }, function (e) {
        if(keyDom){
            $(keyDom).removeClass('key_highlight');
        }
    })

    //绑定五线谱点击事件, 点亮对应键位
    $('.line_triggler').click(function(e) {
        onLineTriggerClick(keyDom)
    })

    //绑定键盘悬停事件
    // var lineDom;
    // $('.key_white, .key_black').hover(function(e) {
    //     //获取父类, 分析在父类中的index,
    //     var parentChilds = e.target.parentElement.children;
    //     var groupIndex = e.target.parentElement.getAttribute('group-index');
    //     var indexInGroup = 0;
    //     for(var i = 0; i< parentChilds.length; i++){
    //         if(parentChilds[i] == e.target){
    //             indexInGroup = i;
    //             break;
    //         }
    //     }
    //     //根据分组和index得到唱名, 匹配之
    //     var group = groupInfo[groupIndex - 1];
    //     //获取所有此分组的线
    //     var lineGroupDom = $('.line_triggler[key-group-index=' + group.index + ']')
    //     //根据在分组中的indx获取对应的唱名
    //     getAbcByIndexInGroup(indexInGroup, group)
    //     var lineIndex = group.minKey + indexInGroup
    //     lineDom = $('.line_triggler[key-index=' + lineIndex+ ']')
    //     lineDom.addClass('line_highlight')
    // }, function (e) {
    //     if(lineDom){
    //         $(lineDom).removeClass('line_highlight')
    //     }
    // })

    //绑定调号选择事件
    $('.diao_panel li').each(function(idx, val){
        $(val).click(function (e) {
            let diaoName = e.target.parentElement.getAttribute('diao-name')
            if(diaoName){
                keyDiao.setDiaoHao(diaoName)
                $(e.target.parentElement.parentElement).children().removeClass('diao_panel_active')
                e.target.parentElement.className = 'diao_panel_active'
                onDiaoHaoChange()
            }
        })
    })

    //键位点击事件
    $('.key_white, .key_black').mousedown(function (e) {
        let keyNum = getKeyNumByKeyDom(e.target)
        //点亮五线谱
        //获取当前调号
        //判断当前点亮的键是否属于升降范围
        //获取升降前键
        //点亮线
        playByKey(keyNum)
        onKeyClickWithTrain(e.target, e.clientY - 80, e.clientX - 32)
    })

    //主题切换图片点击
    $('.skin_img_button').click(function (e) {
        let curTheme = localStorage.getItem('theme')
        changeTheme('css/skin.default.css' === curTheme ? 'css/skin.acg.css' : 'css/skin.default.css')
        $(this).attr('src', 'css/skin.default.css' === curTheme ? 'imgs/default.png' : 'imgs/acg.png')
    })
})

/**
 * 根据键DOM获取键号
 * @param keyDom
 * @returns {number}
 */
function getKeyNumByKeyDom(keyDom) {
    //获取分组
    let groupIndex = keyDom.parentElement.getAttribute('group-index')
    let keyGroup = groupInfo[groupIndex - 1]
    //获取所在分组下标
    let leftElmCount = 0
    let prevElm = keyDom.previousSibling
    while (prevElm.previousSibling != null) {
        prevElm = prevElm.previousSibling.previousSibling
        leftElmCount++
    }
    //根据下标获取分组键号
    return keyGroup.minKey + leftElmCount
}

/**
 * 根据五线谱DOM获取对应的键位DOM
 * @param lineDom 五线谱DOM
 * @returns {*}
 */
function getKeyDomByLineDom(lineDom) {
    let keyGroupIndex = lineDom.getAttribute('key-group-index')
    let keyGroupInfo = groupInfo[keyGroupIndex]
    let lineName = lineDom.getAttribute('line-name')
    let keyIndex = getKeyIndex(lineName, keyGroupInfo)
    let keyGroup = getKeyboardGroup(keyIndex)
    let groupDom = $('.key_group')[keyGroup.groupIndex - 1]
    return $(groupDom).children()[keyGroup.keyInGroupIndex]
}

function getLineDomByKeyDom(keyDom) {
    let keyGroup = keyDom.parentElement.getAttribute('group-index') - 1
    let lineDom = undefined
    $('.line_triggler[key-group-index=' + keyGroup + ']').each(function(idx, val) {
        let eachKeyDom = getKeyDomByLineDom(val)
        if(eachKeyDom == keyDom) {
            lineDom = val
            return false
        }
    })
    return lineDom
}

/**
 * 变更主题
 * @param themePath 主题相对index的路径
 */
function changeTheme(themePath){
    localStorage.setItem('theme', themePath)
    document.getElementById('theme_css').href = themePath
}

/**
 * 显示气泡消息
 * @param msg
 * @param tipLevel
 */
function showTip(msg, tipLevel) {
    let divTipJQ = $('#div_tip')
    divTipJQ.text(msg)
    divTipJQ.css({background:tipLevel.bgColor, borderColor:tipLevel.bdColor, left:$(window).width() / 2 - divTipJQ.width() / 2})
    let aniDiv = document.getElementById('div_tip')
    aniDiv.classList.remove('div_tip_ani')
    void aniDiv.offsetWidth;
    aniDiv.classList.add('div_tip_ani')
}