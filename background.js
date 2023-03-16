/**
 * 监听tab创建
 */
let extensionTypeDefault = "tab";
chrome.storage.local.get(["extensionType"]).then((result) => {
    console.log("get " + JSON.stringify(result));
    if (result.extensionType != undefined) {
        extensionTypeDefault = result.extensionType
    }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "getData": {
            sendResponse({ data: extensionTypeDefault });
            return true;
        } break;
        case "setData": {
            console.log("request " + request.value);
            //保存值
            chrome.storage.local.set({ "extensionType": request.value }).then(() => {
                console.log("set " + request.value);
            });
            extensionTypeDefault = request.value
            sendResponse({ data: "ok" });
        } break;
    }

});



chrome.tabs.onCreated.addListener(function (tab) {
    setGroup(tab);
})
/**
 * 监听tab页面变化(用于处理页面logo问题)
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //仅url变化才除法事件
    if (changeInfo.url != undefined) {
        setGroup(tab);
    }
});
const colors = ["grey", "blue", "yellow", "red", "green", "pink", "purple", "orange"]
//const specialUrl = ["www.google.com", "www.baidu.com"] //特殊处理的地址
async function setGroup(tab) {

    //如果标签状态未完成 则不做操作
    //||tab.pendingUrl.startWith("edge:")||tab.pendingUrl.startWith("chrome:")||tab. pendingUrl.startWith("extension:")||tab.pendingUrl.startWith("file:")

    if (tab.url == "" || tab.pinned || tab.status == "complete") {
        return;
    }
    //获取窗口id 防止乱跳
    const currentWindow = await chrome.windows.getCurrent();
    //获取当前所有标签组
    const groups = await chrome.tabGroups.query({
        windowId: currentWindow.id
    })
    if (extensionTypeDefault == "url") {
        if (tab.groupId != -1) {
            //获取标签组信息
            const thisGroup = await chrome.tabGroups.get(tab.groupId);
            if (thisGroup.title.indexOf(" (auto)") < 0) {
                return;
            }
        }
        createGroupReal(tab, groups, currentWindow);
    }
    else {
        createGroupReal(tab, groups, currentWindow);
        //新标签页独立分组
        // if (tab.url.startsWith("edge://newtab") || tab.url.startsWith("chrome://newtab")) {
        //     createGroupReal(tab, groups, currentWindow);
        // }
        // else{

        // //仅当无分组时候,且走的不是标签页模式 才分组
        // if (tab.groupId == -1) {
        //     createGroupReal(tab, groups, currentWindow);
        // }
    }

    // if (tab.groupId != -1) {
    //     //获取标签组信息
    //     const thisGroup = await chrome.tabGroups.get(tab.groupId);
    //     if (thisGroup.title.indexOf(" (auto)") < 0) {
    //         return;
    //     }
    // }
    // //开始分组
    // createGroupReal(tab, groups, currentWindow);
}
async function createGroupReal(tab, groups, currentWindow) {
    if (extensionTypeDefault == "url") {
        try {
            const domain = getDomain(tab);
            //检查是否有旧group
            const nowGroup = groups.find(a => a.title == domain);
            //无旧组
            if (nowGroup == undefined) {
                //创建组
                await realCreateGroup(currentWindow, tab);

                //将组别排序
                //系统级别最先
                //其次是搜索
                //其次从a-z排序
                const groups = await chrome.tabGroups.query({
                    windowId: currentWindow.id
                })
                let nowGroup = JSON.parse(JSON.stringify(groups));
                nowGroup.sort(sortBy("title", false, String))
                for (let i = 0; i < nowGroup.length; i++) {
                    chrome.tabGroups.move(nowGroup[i].id, {
                        index: -1
                    });
                }
            } else {
                //直接更新组
                await chrome.tabs.group({
                    groupId: nowGroup.id,
                    tabIds: tab.id
                })
            }
        } catch (e) {
            console.error(e)
        }
    }
    else if (extensionTypeDefault == "tab") {
        const domain = getDomain(tab);

        try {
            //从标签页跳转的
            if (tab.groupId > 0) {
                const groupInfo = await chrome.tabGroups.get(tab.groupId);
                if (groupInfo.title.startsWith("~ edge") || groupInfo.title.startsWith("~ chrome")) {
                    const domain = getDomain(tab);
                    chrome.tabGroups.update(tab.groupId, {
                        title: domain
                    });
                }
                return;
            }
            //新标签页直接分组
            if (tab.url.startsWith("edge://newtab") || tab.url.startsWith("chrome://newtab")) {
                await realCreateGroup(currentWindow, tab);
            }
            else {
                if (tab.openerTabId == undefined) {
                    //创建组
                    realCreateGroup(currentWindow, tab);
                }
                else {
                    //查询之前标签页信息
                    let openerTab = await chrome.tabs.get(tab.openerTabId);
                    //判断是否有组
                    if (openerTab.groupId == -1) {
                        //创建组
                        await realCreateGroup(currentWindow, openerTab);
                        //设置打开的标签页的分组
                        openerTab = await chrome.tabs.get(tab.openerTabId);
                        await chrome.tabs.group({
                            groupId: openerTab.groupId,
                            tabIds: tab.id
                        })
                    }
                    else {
                        //设定组
                        await chrome.tabs.group({
                            groupId: openerTab.groupId,
                            tabIds: tab.id
                        })
                        // //防止组名为空 设置组名
                        // const groupInfo = await chrome.tabGroups.get(openerTab.groupId);
                        // if (groupInfo.title == "") {
                        //     const domain = getDomain(tab);
                        //     chrome.tabGroups.update(openerTab.groupId, {
                        //         title: domain
                        //     });
                        // }
                    }

                }

                // //由于新标签页默认算上一个标签页打开的 此处处理
                // if ((tab.groupId == -1 || tab.groupId == undefined)&&tab.openerTabId!=undefined) {
                //     await realCreateGroup(currentWindow, tab);
                //     tab = await chrome.tabs.get(tab.id);
                //     await chrome.tabs.group({
                //         groupId: tab.groupId,
                //         tabIds: tab.openerTabId
                //     })
                // }
                // else{

                // }
            }
            // if (tab.openerTabId == undefined) {
            //     //创建组
            //     realCreateGroup(currentWindow, tab);
            // }
            // else {
            //     //查询之前标签页信息
            //     let openerTab = await chrome.tabs.get(tab.openerTabId);
            //     //判断是否有组
            //     if (openerTab.groupId == -1) {
            //         //创建组
            //         await realCreateGroup(currentWindow, openerTab);
            //         //设置打开的标签页的分组
            //         openerTab = await chrome.tabs.get(tab.openerTabId);
            //         await chrome.tabs.group({
            //             groupId: openerTab.groupId,
            //             tabIds: tab.id
            //         })
            //     }
            //     else {
            //         //设定组
            //         await chrome.tabs.group({
            //             groupId: openerTab.groupId,
            //             tabIds: tab.id
            //         })
            //         // //防止组名为空 设置组名
            //         // const groupInfo = await chrome.tabGroups.get(openerTab.groupId);
            //         // if (groupInfo.title == "") {
            //         //     const domain = getDomain(tab);
            //         //     chrome.tabGroups.update(openerTab.groupId, {
            //         //         title: domain
            //         //     });
            //         // }
            //     }

            // }
        } catch (e) {
            console.error(e)
        }
    }
    // else if (extensionTypeDefault == "both") {
    //     try {
    //         //为新的 则创建组
    //         if (tab.openerTabId == undefined) {
    //             //创建组
    //             realCreateGroup(currentWindow, tab);
    //         }
    //         else {
    //             //查询之前标签页信息
    //             const openerTab = await chrome.tabs.get(tab.openerTabId);
    //             //判断是否有组
    //             if (openerTab.groupId == -1) {
    //                 //创建组
    //                 realCreateGroup(currentWindow, tab);
    //             }
    //             else {
    //                 //设定组
    //                 await chrome.tabs.group({
    //                     groupId: openerTab.groupId,
    //                     tabIds: tab.id
    //                 })
    //             }
    //         }

    //     } catch (e) {
    //         console.error(e)
    //     }
    // }
}
async function realCreateGroup(currentWindow, tab) {
    const domain = getDomain(tab);
    let groupId = await chrome.tabs.group({
        createProperties: {
            windowId: currentWindow.id,
        },
        tabIds: tab.id
    });
    //更新组信息
    await chrome.tabGroups.update(groupId, {
        color: colors[parseInt(Math.random() * 10)],
        title: domain,
    })
}
//获取打开标签页的域名信息
function getDomain(tab) {
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
    return domain
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
