'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Bell, ChevronRight, Cloud, FileText, Folder, Heart, Home, Image as ImageIcon, LogOut, MoreVertical, Play, Plus, Search, Share2, Trash2, UploadCloud, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FileRow = { id:string; name:string; mime_type:string|null; size_bytes:number|null; is_favorite:boolean; is_trashed:boolean; created_at:string; storage_path:string; folder_id:string|null }
type FolderRow = { id:string; name:string; created_at:string }

function category(mime:string|null){
  if (!mime) return 'other'
  if (mime.startsWith('image/')) return 'photos'
  if (mime.startsWith('video/')) return 'videos'
  if (mime.startsWith('audio/')) return 'audio'
  return 'docs'
}
function readableSize(bytes:number|null){
  if (!bytes) return '—'
  const units=['B','KB','MB','GB']; let i=0; let n=bytes
  while(n>=1024 && i<units.length-1){n/=1024;i++}
  return `${n.toFixed(n>=100 || i===0 ? 0 : 1)} ${units[i]}`
}

export default function Dashboard({email}:{email:string}){
  const input = useRef<HTMLInputElement>(null)
  const supabase = useMemo(()=>createClient(),[])
  const [files,setFiles]=useState<FileRow[]>([])
  const [folders,setFolders]=useState<FolderRow[]>([])
  const [loading,setLoading]=useState(true)
  const [uploading,setUploading]=useState(false)
  const [msg,setMsg]=useState('')
  const [query,setQuery]=useState('')
  const [view,setView]=useState<'home'|'files'|'favorites'|'trash'>('home')
  const [folderId,setFolderId]=useState<string|null>(null)

  async function load(){
    setLoading(true)
    const [{data: fileRows},{data: folderRows}] = await Promise.all([
      supabase.from('files').select('*').order('created_at',{ascending:false}),
      supabase.from('folders').select('id,name,created_at').order('created_at',{ascending:true})
    ])
    setFiles((fileRows ?? []) as FileRow[]); setFolders((folderRows ?? []) as FolderRow[]); setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function upload(list:FileList|null){
    if(!list?.length) return
    setUploading(true); setMsg('')
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setMsg('Tu sesión ha expirado.');setUploading(false);return}
    let completed=0
    for(const file of Array.from(list)){
      const safe=file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'_')
      const path=`${user.id}/${crypto.randomUUID()}-${safe}`
      const {error:storageError}=await supabase.storage.from('media').upload(path,file,{upsert:false,contentType:file.type || 'application/octet-stream'})
      if(storageError){setMsg(storageError.message);continue}
      const {error:dbError}=await supabase.from('files').insert({user_id:user.id,folder_id:folderId,name:file.name,storage_path:path,mime_type:file.type,size_bytes:file.size})
      if(dbError){await supabase.storage.from('media').remove([path]);setMsg(dbError.message);continue}
      completed++
    }
    setMsg(`${completed} archivo(s) subido(s).`); setUploading(false); await load()
    if(input.current) input.current.value=''
  }

  async function toggleFavorite(file:FileRow){
    const next=!file.is_favorite
    const {error}=await supabase.from('files').update({is_favorite:next}).eq('id',file.id)
    if(!error) await load()
  }
  async function toggleTrash(file:FileRow){
    const {error}=await supabase.from('files').update({is_trashed:!file.is_trashed}).eq('id',file.id)
    if(!error) await load()
  }
  async function signOut(){await supabase.auth.signOut();window.location.href='/login'}

  const activeFiles=files.filter(f=>view==='trash' ? f.is_trashed : !f.is_trashed)
    .filter(f=>view==='favorites' ? f.is_favorite : true)
    .filter(f=>view!=='files' || f.folder_id===folderId || folderId===null)
    .filter(f=>f.name.toLowerCase().includes(query.toLowerCase()))
  const stats={photos:files.filter(f=>!f.is_trashed && category(f.mime_type)==='photos').length,videos:files.filter(f=>!f.is_trashed && category(f.mime_type)==='videos').length,audio:files.filter(f=>!f.is_trashed && category(f.mime_type)==='audio').length,docs:files.filter(f=>!f.is_trashed && category(f.mime_type)==='docs').length}
  const totalBytes=files.filter(f=>!f.is_trashed).reduce((a,f)=>a+(f.size_bytes||0),0)
  const quota=50*1024**3; const pct=Math.min(100,totalBytes/quota*100)

  return <div className="shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Cloud size={19}/></span><span>Mi Nube <b>Multimedia</b></span></div>
      <div className="searchbar"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar archivos y carpetas…"/><kbd>⌘ K</kbd></div>
      <Bell size={20} className="top-icon"/>
      <div className="profile"><div className="avatar">{email.slice(0,1).toUpperCase()}</div><div className="profile-copy"><b>{email.split('@')[0]}</b><span>Cuenta personal</span></div><button className="icon-btn" onClick={signOut} title="Cerrar sesión"><LogOut size={18}/></button></div>
    </header>
    <div className="app-body">
      <aside className="sidebar">
        <button className="upload-btn" onClick={()=>input.current?.click()}><Plus size={18}/> Subir archivos</button>
        <nav>
          <button className={view==='home'?'nav-item active':'nav-item'} onClick={()=>{setView('home');setFolderId(null)}}><Home size={18}/> Inicio</button>
          <button className={view==='files'?'nav-item active':'nav-item'} onClick={()=>{setView('files');setFolderId(null)}}><Folder size={18}/> Mis archivos</button>
          <button className={view==='favorites'?'nav-item active':'nav-item'} onClick={()=>setView('favorites')}><Heart size={18}/> Favoritos</button>
          <button className="nav-item"><Share2 size={18}/> Compartidos</button>
          <button className={view==='trash'?'nav-item active':'nav-item'} onClick={()=>setView('trash')}><Trash2 size={18}/> Papelera</button>
        </nav>
        <div className="storage-box"><div className="storage-head"><span>Almacenamiento</span><b>{pct.toFixed(1)}%</b></div><div className="progress"><span style={{width:`${Math.max(pct,1)}%`}}/></div><div className="storage-foot">{readableSize(totalBytes)} de 50 GB</div></div>
      </aside>
      <main className="main">
        <section className="hero-row"><div><div className="eyebrow">{view==='home'?'RESUMEN':'ARCHIVOS'}</div><h1>{view==='home'?'Tu nube, ordenada y lista.':view==='favorites'?'Tus favoritos':view==='trash'?'Papelera':'Mis archivos'}</h1><p>Guarda tus recuerdos y documentos con acceso privado.</p></div><button className="secondary-btn" onClick={()=>input.current?.click()}><UploadCloud size={18}/> Subir</button></section>
        {view==='home' && <>
          <section className="stats-grid">
            {[[ImageIcon,'Fotos',stats.photos,'photos'],[Play,'Videos',stats.videos,'videos'],[AudioLines,'Audio',stats.audio,'audio'],[FileText,'Documentos',stats.docs,'docs']].map(([Icon,label,count,tone])=><button key={String(label)} className={`stat-card ${tone}`} onClick={()=>{setView('files');setQuery('')}}><div className="stat-icon"><Icon size={22}/></div><span>{label}</span><b>{count}</b><small>archivos</small></button>)}
          </section>
          <section className="section-head"><div><h2>Carpetas</h2><span>{folders.length} carpetas organizadas</span></div><ChevronRight size={20}/></section>
          <section className="folder-grid">{folders.slice(0,8).map(folder=><button key={folder.id} className="folder-card" onClick={()=>{setFolderId(folder.id);setView('files')}}><Folder size={30}/><div><b>{folder.name}</b><span>Carpeta privada</span></div><MoreVertical size={18}/></button>)}{!folders.length&&!loading&&<div className="empty-card">Tus carpetas aparecerán aquí.</div>}</section>
        </>}
        <section className="section-head files-head"><div><h2>{view==='home'?'Archivos recientes':'Contenido'}</h2><span>{activeFiles.length} resultado(s)</span></div>{view==='files'&&folderId&&<button className="clear-btn" onClick={()=>setFolderId(null)}>Ver todo <X size={14}/></button>}</section>
        <div className="file-list">
          {loading?<div className="empty-card">Cargando tus archivos…</div>:!activeFiles.length?<div className="empty-card"><UploadCloud size={28}/><b>No hay archivos aquí</b><span>Sube fotos, videos, audio o documentos para empezar.</span><button onClick={()=>input.current?.click()}>Seleccionar archivos</button></div>:activeFiles.slice(0,view==='home'?8:100).map(file=><div className="file-row" key={file.id}><div className={`file-thumb ${category(file.mime_type)}`}>{category(file.mime_type)==='photos'?<ImageIcon size={22}/>:category(file.mime_type)==='videos'?<Play size={22}/>:category(file.mime_type)==='audio'?<AudioLines size={22}/>:<FileText size={22}/>}</div><div className="file-main"><b>{file.name}</b><span>{readableSize(file.size_bytes)}</span></div><button className="icon-btn" onClick={()=>toggleFavorite(file)} title="Favorito"><Heart size={18} fill={file.is_favorite?'currentColor':'none'}/></button><button className="icon-btn" onClick={()=>toggleTrash(file)} title={file.is_trashed?'Restaurar':'Papelera'}>{file.is_trashed?<Folder size={18}/>:<Trash2 size={18}/>}</button></div>)}
        </div>
        <div className={`dropzone ${uploading?'busy':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();upload(e.dataTransfer.files)}}><UploadCloud size={28}/><div><b>{uploading?'Subiendo archivos…':'Arrastra archivos aquí'}</b><span>o selecciónalos desde tu dispositivo</span></div><button className="secondary-btn" onClick={()=>input.current?.click()}>Seleccionar</button></div>
        <input ref={input} hidden type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" onChange={e=>upload(e.target.files)}/>
        {msg&&<div className="toast">{msg}</div>}
      </main>
    </div>
  </div>
}
