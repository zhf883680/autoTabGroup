
const bg = chrome.extension.getBackgroundPage();
chrome.runtime.sendMessage({action:"getData"}, (response) => {
    console.debug(response.data)
    var radioObj = document.querySelectorAll('input[name="groupBy"]');
    for(var i = 0;i < radioObj.length;i++){
        console.debug(radioObj[i].value)
        if(radioObj[i].value == response.data){
            radioObj[i].checked = true;//设置选中
        }
    }
});

//设置选中

//变更值
document.getElementById("btnSave").addEventListener("click", function () {
    chrome.runtime.sendMessage({action:"setData",value:document.querySelector('input[name="groupBy"]:checked').value}, (response) => {
    });
})

