/**
 * 监听tab创建
 */
chrome.tabs.onCreated.addListener(function (tab) {
    console.log(tab)
    createGroup(tab);
})
/**
 * 监听tab页面变化(用于处理页面logo问题)
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //仅url变化才除法事件
    if (changeInfo.url != undefined) {
        createGroup(tab);
    }

});
const colors = ["grey", "blue", "yellow", "red", "green", "pink", "purple", "cyan", "green", "blue", "grey"]
//const specialUrl = ["www.google.com", "www.baidu.com"] //特殊处理的地址
function createGroup(tab) {
    //获取窗口id 防止乱跳
    chrome.windows.getCurrent(function (currentWindow) {
        //获取当前所有标签组
        chrome.tabGroups.query({
            windowId: currentWindow.id
        }, function (groups) {

            if (tab.url == "") {
                return;
            }
            try {
                const urlHead = tab.url.split("/")[0];
                console.log(urlHead)
                //获取tab对应的域名
                const host = tab.url.split("/")[2].split(":")[0];
                let domain = "";
                //针对设置页面特殊处理
                if (urlHead == "edge:" || urlHead == "chrome:" || urlHead.indexOf("extension:")>-1||urlHead.indexOf("file:")>-1) {
                    domain = "~" + urlHead.substring(0, urlHead.length - 1);
                } else if (urlHead == "http:" || urlHead == "https:") {
                    //正常页面
                    const domainArr = host.split(".")
                    if (domainArr.length == 1) {
                        domain = domainArr[0];
                    }
                    if (domainArr.length >= 2) {

                        domain = `${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
                        //特殊处理
                        //例如谷歌搜索,百度搜索为一类 其他为另一类
                        if (tab.url.indexOf("www.google.com") > -1 || tab.url.indexOf("www.baidu.com") > -1) {
                            //domain = `${domainArr[domainArr.length-3]}.${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
                            domain = "~ search"
                        }
                        //org.cn  com.cn之类统一处理
                        if(domainArr[domainArr.length-1]=="cn"&&domainArr.length>3){
                            domain = `${domainArr[domainArr.length-3]}.${domainArr[domainArr.length-2]}`;
                        }
                    }
                } else {
                    domain = "~UnKnow"
                }
                //检查是否有旧group
                const nowGroup = groups.find(a => a.title == domain);

                //无旧组
                if (nowGroup == undefined) {
                    chrome.tabs.group({
                        createProperties: {
                            windowId: currentWindow.id,
                        },
                        tabIds: tab.id
                    }, function (groupId) {
                        //将此group设置标题和颜色
                        chrome.tabGroups.update(groupId, {
                            color: colors[parseInt(Math.random() * 10)],
                            title: domain,
                        });
                        //将组别排序
                        //系统级别最先
                        //其次是搜索
                        //其次从a-z排序
                        chrome.tabGroups.query({
                            windowId: currentWindow.id
                        }).then((groups) => {
                            let nowGroup = JSON.parse(JSON.stringify(groups));
                            nowGroup.sort(sortBy("title", false, String))
                            for (let i = 0; i < nowGroup.length; i++) {
                                chrome.tabGroups.move(nowGroup[i].id, {
                                    index: -1,
                                    windowId: currentWindow.id
                                });

                            }
                        })
                    })
                } else {
                    //有就组
                    chrome.tabs.group({
                        groupId: nowGroup.id,
                        tabIds: tab.id
                    })
                }


            } catch (e) {
                console.error(e)
            }
        })
    });
}
//排序函数
var sortBy = function (filed, rev, primer) {
    rev = (rev) ? -1 : 1;
    return function (a, b) {
        a = a[filed];
        b = b[filed];
        if (typeof (primer) != 'undefined') {
            a = primer(a);
            b = primer(b);
        }
        if (a < b) {
            return rev * -1;
        }
        if (a > b) {
            return rev * 1;
        }
        return 1;
    }
};