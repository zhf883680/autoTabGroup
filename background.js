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
const specialUrl = ["google.com","baidu.com"]//特殊处理的地址
async function createGroup(tab) {
    //获取当前的所有tab
    //let groups =[];
    chrome.tabGroups.query({}, function (groups) {
        //const groups = groups;
        //console.log(groups)
        try {
              //获取tab对应的域名
            const host = tab.url.split("/")[2];
            let domain = "";
            //针对设置页面特殊处理
            if(host=="edge"||host=="chrome"){
                domain="设置";
            }
            else if(host=="http"||host=="https"){
                //正常页面
                const domainArr = host.split(".")
                if (domainArr.length == 1) {
                    domain = domainArr[0];
                }
                if (domainArr.length >= 2) {
                   
                    domain = `${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
                    //特殊处理
                    //例如谷歌邮件 谷歌搜索之类
                    if(specialUrl.find(a=>a==domain)){
                        domain = `${domainArr[domainArr.length-3]}.${domainArr[domainArr.length-2]}.${domainArr[domainArr.length-1]}`;
                    }
                }
            }
            else{
                domain="特殊";
            }
            //检查是否有旧group
            const nowGroup = groups.find(a => a.title == domain);
            const groupId = parseInt(new Date().getTime().toString().substring(4));
            //无旧组件
            if (nowGroup == undefined) {
                chrome.tabs.group({
                    createProperties: {
                        windowId: tab.windowId,
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
    
    });
  
   
}