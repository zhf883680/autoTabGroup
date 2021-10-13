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
const specialUrl = ["google.com", "baidu.com"] //特殊处理的地址
async function createGroup(tab) {
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
                const host = tab.url.split("/")[2];
                let domain = "";
                //针对设置页面特殊处理
                if (urlHead == "edge:" || urlHead == "chrome:") {
                    domain = "浏览器";
                } else if (urlHead == "http:" || urlHead == "https:") {
                    //正常页面
                    const domainArr = host.split(".")
                    if (domainArr.length == 1) {
                        domain = domainArr[0];
                    }
                    if (domainArr.length >= 2) {

                        domain = `${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
                        //特殊处理
                        //例如谷歌邮件 谷歌搜索之类
                        if (specialUrl.find(a => a == domain) != undefined) {
                            domain = `${domainArr[domainArr.length-3]}.${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
                        }
                    }
                } else {
                    domain = "特殊";
                }
                //检查是否有旧group
                const nowGroup = groups.find(a => a.title == domain);

                //无旧组件
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
                    })
                } else {
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