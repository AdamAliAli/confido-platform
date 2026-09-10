'use client';
export function BlockForm({data,onChange}:{data:any;onChange:(value:any)=>void}){
  const update=(key:string,value:any)=>onChange({...data,[key]:value});
  return <div className="grid gap-4 md:grid-cols-2">{Object.entries(data||{}).map(([key,value])=>{
    if(Array.isArray(value))return <div key={key} className="md:col-span-2"><label className="mb-2 block text-sm capitalize text-zinc-400">{key}</label><div className="space-y-3">{value.map((item:any,index:number)=><div key={index} className="rounded-lg border border-white/10 bg-black/30 p-3"><BlockForm data={item} onChange={next=>update(key,value.map((v:any,i:number)=>i===index?next:v))}/></div>)}</div></div>;
    if(typeof value==='string')return <label key={key} className="text-sm capitalize text-zinc-400">{key}<input className="mt-2 w-full rounded-lg border border-white/10 bg-black p-3 text-white" value={value} onChange={e=>update(key,e.target.value)}/></label>;
    return null;
  })}</div>
}
