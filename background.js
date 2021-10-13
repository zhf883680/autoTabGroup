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
    //console.log(tab);
    if (changeInfo.url != undefined) {
        createGroup(tab);
    }

});
const colors = ["grey", "blue", "yellow", "red", "green", "pink", "purple", "cyan", "green", "blue", "grey"]
async function createGroup(tab) {
    //获取当前的所有tab
    //let groups =[];
    chrome.tabGroups.query({}, function (groups) {
        //const groups = groups;
        //console.log(groups)
        try {
              //获取tab对应的域名
            const host = tab.url.split("/")[2];
            const domainArr = host.split(".")
            let domain = "";
            if (domainArr.length == 1) {
                domain = domainArr[0];
            }
            if (domainArr.length >= 2) {
                domain = `${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
            }
            //检查是否有旧group
            const nowGroup = groups.find(a => a.title == domain);
            const groupId = parseInt(new Date().getTime().toString().substring(4));
    
            if (nowGroup == undefined) {
                chrome.tabs.group({
                    createProperties: {
                        windowId: tab.windowId,
                        //id:groupId,
                        //color:colors[parseInt(Math.random()*10)]
                    },
                    // groupId: groupId,
                    tabIds: tab.id
                }, function (groupId) {
                    //将此group
                    console.log("创建了Id" + groupId)
                    console.log(domain)
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
            //将当前的tab移入
            //createProperties
            //createProperties
    
            // chrome.tabs.group({
            //     groupId: nowGroup == undefined?groupId:nowGroup.id,
            //     tabIds: tab.id
            // },function(returnGroupId){
            //     console.log(returnGroupId)
            // });
            //chrome.tabs.group();
    
        } catch (e) {
            console.error(e)
        }
    
    });
  
   
}