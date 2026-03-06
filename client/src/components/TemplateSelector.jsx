import { Check, Layout } from 'lucide-react'
import React, { useState } from 'react'

const TemplateSelector = ({ selectedTemplate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false)

    const templates = [
        {
            id: "classic",
            name: "Classic",
            preview: "A clean, traditional resume format with clear sections and professional typography"
        },
        {
            id: "modern",
            name: "Modern",
            preview: "Sleek design with strategic use of color and modern font choices"
        },
        {
            id: "minimal-image",
            name: "Minimal Image",
            preview: "Minimal design with a single image and clean typography"
        },
            {
            id: "minimal",
            name: "Minimal",
            preview: "Ultra-clean design that puts your content front and center"
        },
    ]
  return (
    <div className='relative'>
      <button onClick={()=> setIsOpen(!isOpen)} className='flex items-center gap-1 text-sm text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 ring-blue-300 hover:ring transition-all px-3 py-2 rounded-lg'>
        <Layout size={14} /> <span className='max-sm:hidden'>Template</span>
      </button>
      {isOpen && (
        <div className='absolute top-full w-xs p-3 mt-2 space-y-3 z-10 bg-white rounded-md border border-gray-200 shadow-sm'>
            {templates.map((template)=>(
                <div key={template.id} onClick={()=> {onChange(template.id); setIsOpen(false)}} className={`relative p-3 border rounded-md cursor-pointer transition-all ${selectedTemplate === template.id ?
                    "border-blue-400 bg-blue-100"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-100"
                }`}>
                    {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2">
                            <div className='size-5 bg-blue-400 rounded-full flex items-center justify-center'>
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <h4 className='font-medium text-gray-800'>{template.name}</h4>
                        <div className='mt-2 p-2 bg-blue-50 rounded text-xs text-gray-500 italic'>{template.preview}</div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default TemplateSelector

// ═══════════════════════════════════════════════════════════════
// components/TemplateSelector.jsx  (UPDATED version)
// Now fetches templates from DB instead of hardcoded list
// ═══════════════════════════════════════════════════════════════

// import React, { useEffect, useState, useRef } from "react";
// import { LayoutGridIcon, ChevronDownIcon } from "lucide-react";
// import api from "../configs/api";

// const TemplateSelector = ({ selectedTemplateId, onChange }) => {
//   const [templates, setTemplates] = useState([]);
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   useEffect(() => {
//     api.get("/api/templates").then(({ data }) => {
//       setTemplates(data.templates || []);
//       // Auto-select first template if none selected
//       if (!selectedTemplateId && data.templates.length > 0) {
//         onChange(data.templates[0]);
//       }
//     }).catch(() => {});
//   }, []);

//   useEffect(() => {
//     const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   const selected = templates.find(t => t._id === selectedTemplateId);

//   return (
//     <div className="relative" ref={ref}>
//       <button
//         onClick={() => setOpen(!open)}
//         className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:border-emerald-300 rounded-xl transition-all"
//       >
//         <LayoutGridIcon className="size-3.5 text-emerald-600" />
//         {selected?.name || "Select Template"}
//         <ChevronDownIcon className={`size-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
//       </button>

//       {open && (
//         <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
//           <div className="h-[2px] w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
//           <div className="p-2 max-h-64 overflow-y-auto">
//             {templates.length === 0 && (
//               <p className="text-xs text-slate-400 text-center py-4">No templates published yet.</p>
//             )}
//             {templates.map(t => (
//               <button
//                 key={t._id}
//                 onClick={() => { onChange(t); setOpen(false); }}
//                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${selectedTemplateId === t._id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-50"}`}
//               >
//                 {/* Mini color swatch */}
//                 <div className="size-6 rounded-lg shrink-0" style={{ backgroundColor: t.accentColor || "#059669" }} />
//                 <div className="min-w-0">
//                   <p className="text-xs font-bold text-slate-800 truncate">{t.name}</p>
//                   <p className="text-[10px] text-slate-400 capitalize">{t.config?.layout?.replace("-", " ")}</p>
//                 </div>
//                 {selectedTemplateId === t._id && (
//                   <div className="size-1.5 rounded-full bg-emerald-500 shrink-0 ml-auto" />
//                 )}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TemplateSelector;