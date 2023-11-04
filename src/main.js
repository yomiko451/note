const { invoke, BasedD } = window.__TAURI__.tauri
//获取按钮元素
const addNote = document.querySelector('#add')
const deleteNote = document.querySelector('#delete')
const starNote = document.querySelector('#star')
const copyNote = document.querySelector('#copy')
const container = document.querySelector('.container')
const search = document.getElementsByTagName('input')[0]
//启动时载入笔记
invoke('load_text', {}).then((note) => load(note))
//添加新笔记
addNote.addEventListener('click', addNoteFunction)
//删除笔记
deleteNote.addEventListener('click', deleteNoteFunction)
//笔记星标
starNote.addEventListener('click', starNoteFunction)
//复制笔记内容
copyNote.addEventListener('click', copyNoteFunction)
//实时搜索
search.addEventListener('input', debounce(async function() {
    const noteArrOld = document.querySelectorAll('.note')
    noteArrOld.forEach((t) => { t.remove() })
    await invoke('load_text', {}).then((note) => load(note))
    const noteArr = document.querySelectorAll('.note')
    const kw = document.querySelector('input').value
    noteArr.forEach((t) => {
    const text = t.getElementsByTagName('textarea')[0].value
    if (!text.includes(kw)) { t.remove()}
    })
}, 500))
//业务函数
function addNoteFunction() {
    const newNote = document.createElement('div')
    const timtStamp = document.createElement('p')
    const text = document.createElement('textarea')
    text.addEventListener('input', debounce(function() {
        invoke('save_text', { text:this.value, time: this.previousElementSibling.innerHTML })
    }, 2000))
    text.placeholder = '请输入文字内容'
    invoke('get_time', {}).then((t) => {
        timtStamp.innerHTML = t
    })
    newNote.className = 'note'
    newNote.appendChild(timtStamp)
    newNote.appendChild(text)
    newNote.addEventListener('click', selectFunction)
    container.appendChild(newNote)
}
function deleteNoteFunction() {
    const selectNote = document.querySelector('.selected')
    if (selectNote) {
        const p = selectNote.getElementsByTagName('p')[0]
        invoke('delete_text', { name: p.innerHTML })
        selectNote.remove()
    }
}
function selectFunction() {
    const divs = document.querySelectorAll('.note')
    divs.forEach(function(div) {
        div.classList.remove('selected')
      })
    this.classList.add('selected')
}
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}
function starNoteFunction() {
    const selectNote = document.querySelector('.selected')
    if (selectNote) {
        const p = selectNote.getElementsByTagName('p')[0]
        const textarea = selectNote.getElementsByTagName('textarea')[0]
        const old_p = p.innerHTML
        if (old_p.includes(' ★')) {
            p.innerHTML = p.innerHTML.slice(0,-2)
            invoke('rename_text', { old: old_p, new: p.innerHTML })
            textarea.style.backgroundColor = 'rgb(202, 234, 206)'
        } else {
            p.innerHTML = p.innerHTML + ' ★'
            invoke('rename_text', { old: old_p, new: p.innerHTML })
            textarea.style.backgroundColor = 'rgb(255, 228, 241)'
        }
    }
}
function copyNoteFunction() {
    const selectNote = document.querySelector('.selected')
    if (selectNote) {
        const text = selectNote.getElementsByTagName('textarea')[0]
        invoke('copy_text', { text: text.value })
    }
}
function load(note) {
    note.forEach((n) => {
        const newNote = document.createElement('div')
        const timtStamp = document.createElement('p')
        const text = document.createElement('textarea')
        text.addEventListener('input', debounce(function() {
            invoke('save_text', { text:this.value, time: this.previousElementSibling.innerHTML })
        }, 1000))
        text.placeholder = '请输入文字内容'
        text.value = n.content
        if (n.data.includes(' ★')) {
            text.style.backgroundColor = 'rgb(255, 228, 241)'
        }
        timtStamp.innerHTML = n.data
        newNote.className = 'note'
        newNote.appendChild(timtStamp)
        newNote.appendChild(text)
        newNote.addEventListener('click', selectFunction)
        container.appendChild(newNote)
    }) 
}