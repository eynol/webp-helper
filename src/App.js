/* eslint-disable default-case */
import React, { useEffect, useState, useCallback, useRef } from 'react';

import './App.css';
import { fetchWebPDecoder } from './lib/webp-decoder'

let WebPDecoder;// WebP解码类
let loadingDecoder = false;//异步标记位,防止多次加载脚本

const sleepUntil = async fn => {
  if (typeof fn !== 'function') {
    return
  }
  await new Promise(res => {
    let timmer = setInterval(() => {
      if (fn()) {
        clearInterval(timmer)
        res()
      }
    }, 20)
  })
}
const getDecoder = async () => {
  if (loadingDecoder) {
    await sleepUntil(() => typeof WebPDecoder !== 'undefined')
    return WebPDecoder
  }
  if (!WebPDecoder) {
    loadingDecoder = true
    WebPDecoder = await fetchWebPDecoder()
    loadingDecoder = false
  }
  return WebPDecoder
}
getDecoder()

const WEBP_TESTER = /webp$/
const transformFile = async (file, toJpeg) => {
  const name = file.name.replace(WEBP_TESTER, toJpeg ? 'jpg' : 'png')
  const buffer = await file.arrayBuffer();
  const WebPDecoder = await getDecoder();
  const decoder = new WebPDecoder(buffer);

  let canvas = document.createElement('canvas');
  const blob = await decoder.decodeToBlob(canvas, false);

  let a = document.createElement('a')
  const url = a.href = URL.createObjectURL(blob)
  a.download = name;
  a.className = 'hide';
  a.innerText = '下载文件'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)

}



function App() {

  const [canceled, setCanceled] = useState(false)
  const [isDragOver, setDrag] = useState(false)
  const [isJPEG, setToJpeg] = useState(false)



  const closeDrag = () => {
    setCanceled(false)
    setDrag(false)
  }
  const handleDragOver = useCallback((evt) => {
    if (!isDragOver) {
      setDrag(true)
    }
    if (canceled) {
      event.dataTransfer.dropEffect = "none";
    }
    evt.stopPropagation();
    evt.preventDefault()
  }, [isDragOver, canceled])

  const handleDrop = useCallback((evt) => {
    let files = Array.from(evt.dataTransfer.files)
    files = files.filter(file => file.type === 'image/webp')
    closeDrag()
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        transformFile(files[i], isJPEG)
      }
    }
    evt.stopPropagation();
    evt.preventDefault()
  }, [isJPEG])

  const handleESCKey = (evt) => {
    console.log(evt)
  }

  const changeType = useCallback(() => {
    setToJpeg(!isJPEG)
  }, [isJPEG])

  const lastEnter = useRef(null);

  const listern = useCallback((evt) => {

    switch (evt.type) {
      case 'dragleave': {
        if (lastEnter.current === evt.target) {
          closeDrag()
        }
        break;
      }
      case 'dragenter': {
        if (!isDragOver) {
          setDrag(true);
        }
        lastEnter.current = evt.target;

        break;
      }
    }

    evt.stopPropagation();
    evt.preventDefault()
  }, [isDragOver])

  useEffect(() => {

    const el = document
    el.addEventListener('dragenter', listern)
    el.addEventListener('dragover', handleDragOver)
    el.addEventListener('dragleave', listern)
    el.addEventListener('drop', handleDrop)
    el.addEventListener('keypress', handleESCKey)

    return () => {
      el.removeEventListener('dragenter', listern)
      el.removeEventListener('dragover', handleDragOver)
      el.removeEventListener('dragleave', listern)
      el.removeEventListener('drop', handleDrop)
      el.removeEventListener('keypress', handleESCKey)
    }
  }, [handleDragOver, handleDrop, listern])

  const handleSelectFile = useCallback(async (evt) => {
    let files = Array.from(evt.target.files);
    evt.target.value = '';
    closeDrag()
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        transformFile(files[i], isJPEG)
      }
    }
  }, [isJPEG])

  const clsPNG = 'item ' + (isJPEG ? 'clickable' : 'link')
  const clsJPG = 'item ' + (isJPEG ? 'link' : 'clickable')

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-logo" title="你瞅啥？">WebP Helper</div>
        {isDragOver && (
          <div className="drop-mask">
            <p>松开鼠标后，拖动的文件将会被转换，按 ESC 键取消</p>
            <p ><span className="link" onMouseDown={closeDrag}>知道了</span></p>
          </div>)}
        <p>
          <code>拖动 *.webp 文件到此页面</code>
        </p>
        <p>或</p>
        <p>
          <input id="select-file"
            type='file' multiple
            onChange={handleSelectFile}
            accept=".webp"
            hidden></input>
          <label
            className="btn"
            htmlFor="select-file"
          >
            选择 *.webp 文件
        </label></p>
        <p className="hover-effect">转换为 <span title="点击切换格式" className={clsPNG} onClick={isJPEG ? changeType : undefined}
        >*.png</span>  <span title="点击切换格式" className={clsJPG} onClick={isJPEG ? undefined : changeType}>*.jpg</span>  格式</p>
      </header >
      <footer>
        <p>
          <small>webp_wasm来自<a href="https://github.com/kenchris/wasm-webp" >kenchris/wasm-webp</a></small>
        </p>
      </footer>
      <a className="github-fork-ribbon" href="http://url.to-your.repo" data-ribbon="Fork me on GitHub" title="Fork me on GitHub">Fork me on GitHub</a>
    </div >
  );
}

export default App;
