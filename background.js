/**
 * 监听tab创建
 */
chrome.tabs.onCreated.addListener(function (tab) {
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
const colors = ["grey", "blue", "yellow", "red", "green", "pink", "purple", "orange"]
//const specialUrl = ["www.google.com", "www.baidu.com"] //特殊处理的地址
function createGroup(tab) {
    //获取窗口id 防止乱跳
    chrome.windows.getCurrent(function (currentWindow) {
        //获取当前所有标签组
        chrome.tabGroups.query({
            windowId: currentWindow.id
        }, function (groups) {
            console.debug(tab);
            if (tab.url == "" || tab.pinned || tab.status == "complete") {
                return;
            }
            //仅auto下的标签页才会自动分组 非auto的不自动分组
            console.debug("是否分组")
            if (tab.groupId != -1) {
                chrome.tabGroups.get(tab.groupId,
                    function (group) {
                        console.debug(group);
                        if (group.title.indexOf(" (auto)") < 0) {
                            return;
                        }
                        else{
                            console.debug("是否分组结束")
                            createGroupReal(tab,groups,currentWindow);
                        }
                    }
                )
            }
            else{
                createGroupReal(tab,groups,currentWindow);
            }
          
        })
    });
}
function createGroupReal(tab,groups,currentWindow){
    try {
        const urlHead = tab.url.split("/")[0];
        console.debug(urlHead)
        //获取tab对应的域名
        const host = tab.url.split("/")[2].split(":")[0];
        let domain = "";
        //针对设置页面特殊处理
        if (urlHead == "edge:" || urlHead == "chrome:" || urlHead.indexOf("extension:") > -1 || urlHead.indexOf("file:") > -1) {
            domain = "~ " + urlHead.substring(0, urlHead.length - 1);
        } else if (urlHead == "http:" || urlHead == "https:") {
            //正常页面
            const domainArr = host.split(".")
            if (domainArr.length == 1) {
                domain = domainArr[0];
            }
            if (domainArr.length >= 2) {

                domain = `${domainArr[domainArr.length - 2]}.${domainArr[domainArr.length - 1]}`;
                //特殊处理
                //例如谷歌搜索,百度搜索为一类 其他为另一类
                if (tab.url.indexOf("www.google.com") > -1 || tab.url.indexOf("www.baidu.com") > -1) {
                    //domain = `${domainArr[domainArr.length-3]}.${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
                    domain = "~ search"
                }
                //org.cn  com.cn之类统一处理
                if (domainArr[domainArr.length - 1] == "cn" && domainArr.length > 3) {
                    domain = `${domainArr[domainArr.length - 3]}.${domainArr[domainArr.length - 2]}`;
                }
            }
        } else {
            domain = "~ UnKnow"
        }
        domain = domain + " (auto)"
        //检查是否有旧group
        const nowGroup = groups.find(a => a.title == domain);
        console.debug("开始设置组")
        //无旧组
        if (nowGroup == undefined) {
            chrome.tabs.group({
                createProperties: {
                    windowId: currentWindow.id,
                },
                tabIds: tab.id
            }, function (groupId) {
                console.debug("开始调整创建组")
                //将此group设置标题和颜色
                chrome.tabGroups.update(groupId, {
                    color: colors[parseInt(Math.random() * 10)],
                    title: domain,
                });
                //将组别排序
                //系统级别最先
                //其次是搜索
                //其次从a-z排序
                console.debug("开始排序组")
                chrome.tabGroups.query({
                    windowId: currentWindow.id
                }).then((groups) => {
                    let nowGroup = JSON.parse(JSON.stringify(groups));
                    nowGroup.sort(sortBy("title", false, String))
                    console.debug("开始移动组")
                    for (let i = 0; i < nowGroup.length; i++) {
                        console.debug(nowGroup[i]);
                        chrome.tabGroups.move(nowGroup[i].id, {
                            index: -1
                        });
                    }
                })
            })
        } else {
            //有就组
            console.debug("直接更新")
            chrome.tabs.group({
                groupId: nowGroup.id,
                tabIds: tab.id
            })
        }


    } catch (e) {
        console.error(e)
    }
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
// var allLiveGroups = [];
// //保存
// function addGroup() {
//     allLiveGroups.push(data);
//     chrome.tabs.create({
//         tabIds: tab.id
//     }).then((tab) => {
//         chrome.tabs.group({
//             tabIds: tab.id
//         }).then((groupId) => {
//             chrome.tabGroups.update(groupId, {
//                 color: colors[parseInt(Math.random() * 10)],
//                 title: data.groupName,
//             });
//         })
//     })
//     //about:blank
//     saveAllLiveGroup();
// }
// //针对数组操作

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     // 2. A page requested user data, respond with a copy of `user`
//     if (message === 'deleteGroup') {
//         allLiveGroups.splice(allLiveGroups.findIndex(item => item.id == data.id), 1);
//         saveAllLiveGroup();
//         sendResponse("ok");
//     }
//     if (message === 'getGroup') {
//         chrome.storage.sync.get(["allLiveGroups"], function (result) {
//             console.log('Value currently is ' + result);
//             allLiveGroups = result;
//             sendResponse(allLiveGroups);
//         });
//     }
// });

// //保存
// function saveAllLiveGroup() {
//     // chrome.storage.sync.set({
//     //     "allLiveGroups": allLiveGroups
//     // }, function () {
//     //     console.log('Value is set to ' + value);
//     // });
// }