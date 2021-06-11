//页面片段下标, 自增作为节点ID
var footageIndex = 1
//每个片段需要按下的琴键节点
var activeKeyList = []
//所有片段集合
var keyFootages = {}
//音频缓存 key = 琴键号(1-88), value = 音频对象
var audioCacheMap = {}
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
        var diaoInfo = this.diaoPkg[this.diaoHao]
        if (diaoInfo.blackKeys.indexOf(key) >= 0) {
            return diaoInfo.offset
        }
        return 0
    },
    //变更当前调号
    setDiaoHao: function (diaoHao) {
        this.diaoHao = diaoHao
    }
};

/**
 * 根据键位总下标, 获取在其所属分组的下标
 * @param index  键盘号
 * @param group 键盘号所在组
 * @returns {number}
 */
function getKeyInGroupIndex(index, group) {
    var x = 0;
    for(var i = group.minKey; i <= group.maxKey; i++){
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
    for(var i = 0; i < groupInfo.length; i++){
        var group = groupInfo[i]
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

/**
 * 取消所有键位选中状态
 */
function deactiveAllKey(){
    $('.key_highlight_fix').removeClass('key_highlight_fix')
    activeKeyList = []
}

/**
 * 根据键位号播放对应的音频(音调)
 * @param keyNum (1-88)
 */
function playByKey(keyNum){
    console.log(keyNum)
    if(audioCacheMap[keyNum]){
        audioCacheMap[keyNum].currentTime = 0
        audioCacheMap[keyNum].play()
        return
    }
    let audio = new Audio('audio/key/' + keyNum + '.mp3')
    audioCacheMap[keyNum] = audio
    audio.play()
}

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
    //生成五线谱节点
    var lineGroup = $('.line_group')
    var isDiv = false
    var keyNameIndex = 0;
    var keyNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    var currentGroup = 9;
    //0-53号键位(标准五线)以外用半透明线表示
    for(var i = 53; i > 0; i--){
        var dom;
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
        var lineName = keyNames[keyNameIndex--]
        dom.setAttribute('line-name', lineName)
        dom.setAttribute('key-group-index', currentGroup - 1)
        if(keyNameIndex < 0){
            keyNameIndex = 6
            currentGroup--;
        }
        if((i < 15 || i > 35) && isDiv){
            dom.style.borderColor = '#b1b1b1';
        }
        lineGroup.append(dom)
    }

    //创建调号修改面板
    let diaoPanel = $('.diao_panel')
    let activeClass = 'diao_panel_active'
    for(let diao in keyDiao.diaoPkg){
        let diaoName = diao
        let diaoItem = keyDiao.diaoPkg[diao]
        let diaoDomHTML = '<li diao-name="' + diaoName + '" class="' + activeClass + '">'
        diaoDomHTML += '<img src="imgs/diaohao/' + diaoName + '.png" />'
        diaoDomHTML += '<span>' + diaoItem.desc + '</span>'
        diaoDomHTML += '</li>'
        diaoPanel.append(diaoDomHTML)
        activeClass = ''
    }

    //绑定五线谱鼠标悬停事件
    var keyDom;
    $('.line_triggler').hover(function(e) {
        keyDom = getKeyDomByLineDom(e.target)
        $(keyDom).addClass('key_highlight');
        if(!trainEnv.isTrain){
            //训练模式下, 鼠标悬停到五线谱不显示音名
            $('#key-name').text( e.target.getAttribute('line-name'))
        }
    }, function (e) {
        if(keyDom){
            $(keyDom).removeClass('key_highlight');
        }
    })

    //绑定五线谱点击事件, 点亮对应键位
    $('.line_triggler').click(function(e) {
        if(keyDom){
            if($(keyDom).hasClass('key_highlight_fix')) return
            $(keyDom).addClass('key_highlight_fix')
            activeKeyList.push(keyDom)
        }
    })

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

    //绑定播放样本曲谱按钮
    $('#button_sample_play').click(function(e){
        if(sheet.isPlaying){
            clearInterval(sheet.playHandler)
            sheet.isPlaying = false
            return
        }
        playBySheet(sheet)
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
                //如果处于训练模式, 重新随机
                if(trainEnv.isTrain){
                    $('#button_start_train').trigger('click')
                    $('#button_start_train').trigger('click')
                }
            }
        })
    })

    //键位点击事件
    $('.key_white, .key_black').mousedown(function (e) {
        //获取分组
        let groupIndex = e.target.parentElement.getAttribute('group-index')
        let keyGroup = groupInfo[groupIndex - 1]
        //获取所在分组下标
        let leftElmCount = 0
        let prevElm = e.target.previousSibling
        while (prevElm.previousSibling != null) {
            prevElm = prevElm.previousSibling.previousSibling
            leftElmCount++
        }
        //根据下标获取分组键号
        let keyNum = keyGroup.minKey + leftElmCount
        //点亮五线谱
        //获取当前调号
        //判断当前点亮的键是否属于升降范围
        //获取升降前键
        //点亮线
        playByKey(keyNum)

        if(trainEnv.isTrain){
            //训练模式
            if(e.target == trainEnv.correctKeyDom){
                $('#key-name').text(trainEnv.currentLineDom.getAttribute('line-name'))
                //如果按对了, 消除上一个线/间, 重新开始生成随机线/间
                reRandomTrainLine()
                //显示动画
                $('#press_correct_img').css({top:e.clientY - 80, left:e.clientX - 32})
                var aniImg = document.getElementById("press_correct_img");
                aniImg.classList.remove("press_correct_ani");
                // -> triggering reflow /* The actual magic */
                // without this it wouldn't work. Try uncommenting the line and the transition won't be retriggered.
                // This was, from the original tutorial, will no work in strict mode. Thanks Felis Phasma! The next uncommented line is the fix.
                // element.offsetWidth = element.offsetWidth;
                //为了css3动画能够重新播放, 需要这行
                void aniImg.offsetWidth;
                // -> and re-adding the class
                aniImg.classList.add("press_correct_ani");
            }
        }
    })

    //开始训练按钮点击事件
    $('#button_start_train').click(function (e) {
        trainEnv.isTrain = !trainEnv.isTrain
        if(!trainEnv.isTrain){
            //停止训练
            if(trainEnv.currentLineDom){
                $(trainEnv.currentLineDom).removeClass('line_highlight')
            }
            trainEnv.currentLineDom = null
            trainEnv.correctKeyDom = null
            trainEnv.randomAbleLine = []
            $(this).removeClass('start_train_button_active')
            return
        }
        $(this).addClass('start_train_button_active')
        let startGroupIndex = 2
        let endGroupIndex = 5
        //获取指定范围的线/间
        $('.line_group').children().each(function (idx, val) {
            let groupIndex = parseInt(val.getAttribute('key-group-index'))
            if (groupIndex > endGroupIndex || groupIndex < startGroupIndex) {
                return
            }
            trainEnv.randomAbleLine.push(val)
        })
        reRandomTrainLine()
    })
})

/**
 * 重新生成随机五线谱选中线
 */
function reRandomTrainLine() {
    if(trainEnv.currentLineDom){
        $(trainEnv.currentLineDom).removeClass('line_highlight')
    }
    let minRandomIdx = 0
    let maxRandomIdx = trainEnv.randomAbleLine.length - 1
    let luckyLineIndex = Math.floor(Math.random() * (maxRandomIdx - minRandomIdx + 1)) + minRandomIdx
    trainEnv.currentLineDom = trainEnv.randomAbleLine[luckyLineIndex]
    //获取此线/间对应的键位
    trainEnv.correctKeyDom = getKeyDomByLineDom(trainEnv.randomAbleLine[luckyLineIndex])
    //点亮线/间
    $(trainEnv.currentLineDom).addClass('line_highlight')
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
    let keyIndex = getKeyIndex(lineName, keyGroupInfo);
    let keyGroup = getKeyboardGroup(keyIndex);
    let groupDom = $('.key_group')[keyGroup.groupIndex - 1];
    return $(groupDom).children()[keyGroup.keyInGroupIndex]
}

/**
 * 根据曲谱样本播放音频
 * @param sheet
 */
function playBySheet(sheet) {
    let idx = 0
    let item = sheet.data[idx]
    sheet.isPlaying = true
    sheet.playHandler = setInterval(function () {
        for (let dataIndex in item){
            let keyNum = item[dataIndex]
            if(keyNum == 0)
                continue
            playByKey(keyNum)
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

