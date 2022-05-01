window.addEventListener('localized', function() {
    let language = Intl.DateTimeFormat().resolvedOptions().locale
    if(language.indexOf('zh')>=0){
        language = 'zh'
    }
    document.documentElement.lang = language
    document.getElementById('feedback_like').href = 'https://chrome.google.com/webstore/detail/'+chrome.runtime.id
}, false)