import{j as e}from"./ui--9QRf85z.js";import{r as f}from"./recharts-B16uQ_Zp.js";import{K as Ue,L as Re,S as Ge,t as S}from"./app-Bf17O6Tg.js";import{A as Le}from"./app-layout-jqg5_jOc.js";import{B as m}from"./button-3fVzTxZH.js";import{B as ge}from"./badge-CTYXlqUe.js";import{D as ue,a as ve,b as we,c as je,d as Ve}from"./dialog-BLXZUGjO.js";import{v as d,C as Oe,m as Pe,h as g}from"./react-big-calendar-BlXibPcB.js";import{C as x,a as ke}from"./circle-check-big-DKZvEq1H.js";import{U as k}from"./user-B9S7Zak9.js";import{R as We}from"./rotate-ccw-Pe8vli6_.js";import{C as qe,a as Ke}from"./x-eWc-uscP.js";import{C as A}from"./circle-play-Dthy1u5D.js";import{C as Xe}from"./chevron-left-BEER2g75.js";import{C as Ne}from"./clock-rsHRdq3d.js";import{M}from"./map-pin-B6MGBFhT.js";import"./react-B1hewrmX.js";import"./index--i9LXxpm.js";import"./utils-DvwAYYBZ.js";import"./tooltip-Dm-vk6MS.js";import"./check-C_IBZmq_.js";import"./createLucideIcon-BBA9I-xQ.js";import"./index-BDFBH7XS.js";import"./index-BsIecJEN.js";import"./index-Df3HipqK.js";import"./chevrons-up-down-DaqTssCh.js";import"./memoize-one.esm-C_vqz2--.js";g.locale("en");const Je=Pe(g),Qe=`
/* Base Calendar - Clean Modern Look */
.rbc-calendar {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff;
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: none;
}

/* Header - Google Calendar Style */
.rbc-header {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    color: #334155;
    border: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 12px;
    font-weight: 600;
    font-size: 13px;
    text-align: center;
    letter-spacing: 0.025em;
    position: relative;
}

.rbc-header:hover {
    background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
    transition: background 0.2s ease;
}

.rbc-header + .rbc-header {
    border-left: 1px solid #e2e8f0;
}

/* Today Cell - Subtle Highlight */
.rbc-today {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-radius: 8px;
    position: relative;
}

.rbc-today::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.05), transparent, rgba(59, 130, 246, 0.05));
    border-radius: 8px;
    animation: subtlePulse 3s infinite;
}

@keyframes subtlePulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
}

/* Date Cells - Clean and Interactive */
.rbc-date-cell {
    padding: 12px 8px;
    border-right: 1px solid #f1f5f9;
    font-weight: 500;
    color: #475569;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: #ffffff;
    position: relative;
}

.rbc-date-cell:hover {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.rbc-off-range-bg {
    background: #fafafa;
}

.rbc-off-range {
    color: #94a3b8;
    opacity: 0.7;
}

/* Current Time Indicator - Blue Line */
.rbc-current-time-indicator {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    height: 2px;
    z-index: 10;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    border-radius: 1px;
}

/* Time Slots - Minimal and Clean */
.rbc-time-slot {
    border-top: 1px solid #f8fafc;
    min-height: 30px;
    transition: background-color 0.15s ease;
    background: #ffffff;
}

.rbc-time-slot:hover {
    background: rgba(59, 130, 246, 0.02);
}

.rbc-timeslot-group {
    border-bottom: 1px solid #f1f5f9;
    min-height: 60px;
}

.rbc-time-gutter .rbc-timeslot-group {
    border-right: 1px solid #f1f5f9;
}

.rbc-time-header-gutter {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    border-right: 1px solid #e2e8f0;
}

.rbc-time-gutter {
    background: #fafafa;
    border-right: 1px solid #f1f5f9;
}

.rbc-time-slot-time {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    padding: 4px 8px;
    text-align: right;
}

/* Events - Modern Card Style */
.rbc-day-slot .rbc-event, .rbc-week-view .rbc-event {
    border: none;
    border-radius: 8px;
    margin: 1px 2px;
    padding: 0;
    min-height: 60px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
}

.rbc-event {
    border-radius: 8px;
    border: none !important;
    color: white !important;
    font-size: 12px;
    padding: 0 !important;
    overflow: hidden !important;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    position: relative;
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
}

.rbc-event:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.08);
    z-index: 100;
}

.rbc-event:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

.rbc-event-content {
    overflow: hidden !important;
    white-space: normal !important;
    line-height: 1.3;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    padding: 0 !important;
    position: relative;
    z-index: 2;
}

/* Month View - Clean Grid */
.rbc-month-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-month-row {
    border-bottom: 1px solid #f1f5f9;
}

.rbc-month-row:last-child {
    border-bottom: none;
}

.rbc-date-cell a {
    color: #475569;
    font-weight: 600;
    text-decoration: none;
    padding: 6px 8px;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
    position: relative;
}

.rbc-date-cell a:hover {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.rbc-date-cell.rbc-today a {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* Agenda View - List Style */
.rbc-agenda-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-agenda-view table.rbc-agenda-table {
    font-size: 14px;
    width: 100%;
}

.rbc-agenda-view .rbc-agenda-content {
    padding: 16px;
}

.rbc-agenda-view .rbc-event {
    background: none !important;
    border: none !important;
    color: inherit !important;
    min-height: auto;
    padding: 12px 16px;
    border-radius: 12px;
    margin: 4px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-left: 3px solid #3b82f6 !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    position: relative;
    overflow: hidden;
}

.rbc-agenda-view .rbc-event:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
    border-left-width: 4px !important;
}

.rbc-agenda-date-cell {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-weight: 600;
    color: #475569;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
}

.rbc-agenda-time-cell {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    font-weight: 500;
    color: #64748b;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
}

.rbc-agenda-event-cell {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
}

/* Week/Time Views */
.rbc-time-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-time-header {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid #f1f5f9;
}

.rbc-time-content {
    border: none;
    background: #ffffff;
}

.rbc-allday-cell {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
    padding: 6px 0;
}

.rbc-row-content {
    border-bottom: 1px solid #f1f5f9;
}

/* Custom Scrollbar - Minimal */
.rbc-time-content::-webkit-scrollbar {
    width: 8px;
}

.rbc-time-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

.rbc-time-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
    border-radius: 4px;
    border: 1px solid #f1f5f9;
}

.rbc-time-content::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

/* Custom Event Content - Clean Typography */
.custom-event-content {
    color: #ffffff !important;
    position: relative;
    overflow: hidden;
}

.custom-event-content * {
    color: #ffffff !important;
    position: relative;
    z-index: 2;
}

.custom-event-content .event-time {
    color: #ffffff !important;
    font-weight: 600 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-client {
    color: #ffffff !important;
    font-weight: 700 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-title {
    color: #ffffff !important;
    font-weight: 500 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-location {
    color: #ffffff !important;
    opacity: 0.95 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content svg {
    color: #ffffff !important;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

/* Loading Animation - Subtle */
@keyframes eventAppear {
    0% { 
        opacity: 0; 
        transform: translateY(10px) scale(0.95); 
    }
    100% { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
    }
}

.rbc-event {
    animation: eventAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive Design */
@media (max-width: 768px) {
    .rbc-calendar {
        border-radius: 12px;
    }
    
    .rbc-header {
        padding: 8px 6px;
        font-size: 11px;
    }
    
    .rbc-time-slot-time {
        font-size: 10px;
        padding: 2px 6px;
    }
    
    .rbc-event {
        border-radius: 6px;
        min-height: 40px !important;
    }
    
    .rbc-date-cell {
        padding: 8px 4px;
    }
}

/* Focus States for Accessibility */
.rbc-calendar *:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
}

/* Selection States */
.rbc-selected {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
    color: white !important;
}

/* Drag and Drop States */
.rbc-addons-dnd-drag-row {
    background: rgba(59, 130, 246, 0.1);
}

.rbc-addons-dnd-over {
    background: rgba(59, 130, 246, 0.2);
}
`,_={scheduled:{label:"Scheduled",color:"bg-blue-100 text-blue-800",bgColor:"#3B82F6",icon:x},in_progress:{label:"In Progress",color:"bg-yellow-100 text-yellow-800",bgColor:"#F59E0B",icon:A},completed:{label:"Completed",color:"bg-green-100 text-green-800",bgColor:"#10B981",icon:ke},cancelled:{label:"Cancelled",color:"bg-red-100 text-red-800",bgColor:"#EF4444",icon:qe},rescheduled:{label:"Rescheduled",color:"bg-gray-100 text-gray-800",bgColor:"#6B7280",icon:We},no_show:{label:"No Show",color:"bg-orange-100 text-orange-800",bgColor:"#F97316",icon:k}};function Et({appointments:ye,technicals:De,auth:E,isTechnicalDefault:u,googleMapsApiKey:y}){var O,P,W,q,K,X,J,Q;const[z,Ce]=f.useState(null),[Ze,et]=f.useState(!1),{props:tt}=Ue(),v=(P=(O=E.user)==null?void 0:O.roles)==null?void 0:P.includes("technical"),Se=(q=(W=E.user)==null?void 0:W.roles)==null?void 0:q.includes("super-admin"),Me=v||u?d.AGENDA:d.DAY,[p,B]=f.useState(Me),[$,F]=f.useState(new Date),[H,I]=f.useState([]),[st,U]=f.useState(!1),[o,w]=f.useState({open:!1}),[D,R]=f.useState({open:!1}),Ae=t=>{if(!t)return"";if(t.includes("maps.app.goo.gl"))return`https://www.google.com/maps/embed/v1/place?key=${y}&q=-10.916879,-74.883391&zoom=15`;if(t.includes("/embed"))return t;if(t.includes("google.com/maps")){const s=t.match(/@([-0-9.]+),([-0-9.]+)/);if(s)return`https://www.google.com/maps/embed/v1/view?key=${y}&center=${s[1]},${s[2]}&zoom=15`;const r=t.match(/place\/([^\/]+)/);if(r)return`https://www.google.com/maps/embed/v1/place?key=${y}&q=place_id:${r[1]}`}return`https://www.google.com/maps/embed/v1/place?key=${y}&q=${encodeURIComponent(t)}`},Ee=async t=>{console.log("fetchFullAppointmentData called with ID:",t);try{const s=await fetch(`/appointments/${t}/details`);if(console.log("API response status:",s.status),s.ok){const r=await s.json();return console.log("Received appointment data:",r),r.appointment}else console.error("API response not ok:",s.status,s.statusText)}catch(s){console.error("Error fetching appointment details:",s)}return null},G=async(t,s="view")=>{var n,a,l,i;if(console.log("openAppointmentModal called with:",{appointment:t,action:s}),(a=(n=t==null?void 0:t.ticket)==null?void 0:n.device)!=null&&a.tenants||(i=(l=t==null?void 0:t.ticket)==null?void 0:l.user)!=null&&i.tenant){console.log("Using existing appointment data - has relationships"),w({open:!0,appointment:t});return}console.log("Fetching full appointment data for ID:",t.id);const r=await Ee(t.id);r?(console.log("Successfully fetched full appointment data:",r),w({open:!0,appointment:r})):(console.log("Failed to fetch full appointment data, using fallback"),w({open:!0,appointment:t}))},$e=async t=>{if(t){U(!0);try{const r=await(await fetch(`/appointments/${t}`)).json();Ce(r)}catch(s){console.error("Error refreshing appointment:",s)}finally{U(!1)}}},c=ye;f.useEffect(()=>{const t=()=>{const r=new Date,n=new Date(r.getTime()+30*60*1e3);c.forEach(a=>{if(a.status==="scheduled"){const l=new Date(a.scheduled_for);if(l<=n&&l>r){const i=Math.floor((l.getTime()-r.getTime())/6e4),b=v||u?`🔔 You have an appointment in ${i} minutes with ${a.ticket.user.name}: ${a.title}`:`Upcoming appointment in ${i} minutes: ${a.title}`;I(h=>h.includes(b)?h:[...h,b])}}})};t();const s=setInterval(t,6e4);return()=>clearInterval(s)},[c,v,u]);const L=t=>_[t]||_.scheduled,Ye=f.useMemo(()=>{const t=c.map(s=>{const r=new Date(s.scheduled_for),n=new Date(r.getTime()+s.estimated_duration*6e4);return console.log("🗓️ Converting appointment:",{id:s.id,title:s.title,scheduled_for:s.scheduled_for,start:r.toISOString(),end:n.toISOString(),localStart:r.toLocaleString(),localEnd:n.toLocaleString()}),{id:s.id,title:`${s.ticket.user.name} - ${s.title}`,start:r,end:n,resource:s,allDay:!1}});return console.log("🗓️ Total calendar events created:",t.length),t},[c]),Te=t=>{G(t.resource)},_e=t=>{console.log("Selected slot:",t)},Y=t=>{let s=new Date($);switch(t){case"prev":p===d.DAY?s.setDate(s.getDate()-1):p===d.WEEK?s.setDate(s.getDate()-7):p===d.MONTH&&s.setMonth(s.getMonth()-1);break;case"next":p===d.DAY?s.setDate(s.getDate()+1):p===d.WEEK?s.setDate(s.getDate()+7):p===d.MONTH&&s.setMonth(s.getMonth()+1);break;case"today":s=new Date;break}F(s)},ze=()=>{const t=g($);switch(p){case d.DAY:return t.format("dddd, MMMM Do YYYY");case d.WEEK:{const s=t.clone().startOf("week"),r=t.clone().endOf("week");return`${s.format("MMM Do")} - ${r.format("MMM Do, YYYY")}`}case d.MONTH:return t.format("MMMM YYYY");case d.AGENDA:return"Agenda View";default:return t.format("MMMM YYYY")}},T=async(t,s,r)=>{try{const n=t==="member_feedback"?"member-feedback":t;Ge.post(`/appointments/${s}/${n}`,r||{},{preserveScroll:!0,onSuccess:a=>{const l=a.props.flash||{},i={start:"Visit started successfully!",complete:"Visit completed successfully! Waiting for member feedback.",member_feedback:"Thank you for your feedback!",cancel:"Appointment cancelled successfully!",reschedule:"Appointment rescheduled successfully!","no-show":"Appointment marked as No Show successfully!"},b=l.success||l.message||i[t]||`${t} completed successfully`;S.success(b),z&&$e(z.id)},onError:a=>{console.error(`Error ${t} appointment:`,a),typeof a=="object"&&a!==null?Object.values(a).flat().forEach(i=>{typeof i=="string"&&S.error(i)}):S.error(`Error processing ${t} action`)}})}catch(n){console.error(`Error ${t} appointment:`,n),S.error(`Error processing ${t} action`)}},Be=t=>({style:{border:"none",borderRadius:"8px",padding:"0",backgroundColor:"transparent",overflow:"visible"}}),Fe=({event:t})=>{const s=t.resource,n=L(s.status).icon,a={scheduled:"linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",in_progress:"linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",completed:"linear-gradient(135deg, #10B981 0%, #059669 100%)",cancelled:"linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",rescheduled:"linear-gradient(135deg, #6B7280 0%, #4B5563 100%)",no_show:"linear-gradient(135deg, #F97316 0%, #EA580C 100%)"};return e.jsxs("div",{className:"w-full h-full text-white text-xs p-1.5 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 relative",style:{minHeight:"100%",height:"100%",borderRadius:"6px",background:a[s.status]||a.scheduled,border:"none",boxShadow:"0 2px 8px rgba(0, 0, 0, 0.1)",display:"flex",flexDirection:"column",justifyContent:"flex-start"},title:`${s.ticket.user.name} - ${s.title} at ${C(s.scheduled_for)}`,children:[e.jsxs("div",{className:"flex items-center gap-1.5 mb-1 flex-shrink-0",children:[e.jsx(n,{className:"w-3 h-3 flex-shrink-0 opacity-90"}),e.jsx("span",{className:"font-bold text-xs leading-none",children:C(s.scheduled_for)})]}),e.jsx("div",{className:"font-semibold text-xs leading-tight mb-1 flex-shrink-0",children:s.ticket.user.name}),e.jsx("div",{className:"text-xs opacity-95 leading-tight mb-1 overflow-hidden",children:s.title}),e.jsxs("div",{className:"text-xs opacity-90 leading-tight flex-1 overflow-hidden",children:[e.jsx(M,{className:"w-2 h-2 inline mr-1"}),(()=>{const l=s.address;return l&&l.length>20?l.substring(0,20)+"...":l||"No address"})()]}),e.jsx("div",{className:"absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white opacity-75 rounded-full"})]})},V=c.filter(t=>{const s=new Date(t.scheduled_for),r=new Date,n=new Date(r.getTime()+7*24*60*60*1e3);return s>=r&&s<=n&&t.status==="scheduled"}).sort((t,s)=>new Date(t.scheduled_for).getTime()-new Date(s.scheduled_for).getTime()),C=t=>new Date(t).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1}),He=t=>new Date(t).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),Ie=t=>{const s=L(t),r=s.icon;return e.jsxs(ge,{className:`${s.color} border-0`,children:[e.jsx(r,{className:"w-3 h-3 mr-1"}),s.label]})};return e.jsxs(Le,{breadcrumbs:[{title:"Calendar",href:"/appointments"}],children:[e.jsx(Re,{title:"Appointments Calendar"}),e.jsx("style",{dangerouslySetInnerHTML:{__html:Qe}}),e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50",children:[e.jsx("div",{className:"sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm",children:e.jsx("div",{className:" mx-auto px-6 py-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg",children:e.jsx(x,{className:"w-8 h-8 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",children:v||u?"My Schedule":"Calendar Management"}),e.jsx("p",{className:"text-sm text-slate-600 font-medium",children:v||u?`${E.user.name}'s appointments and tasks`:"Comprehensive appointment scheduling system"})]})]}),e.jsx("div",{className:"hidden lg:flex items-center gap-2",children:Object.entries(_).map(([t,s])=>{const r=s.icon;return e.jsxs("div",{className:"flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm hover:shadow-md transition-all duration-200",children:[e.jsx("div",{className:"w-2 h-2 rounded-full",style:{backgroundColor:s.bgColor}}),e.jsx(r,{className:"w-3.5 h-3.5 text-slate-600"}),e.jsx("span",{className:"text-xs font-medium text-slate-700",children:s.label})]},t)})})]})})}),H.length>0&&e.jsx("div",{className:" mx-auto px-6 pt-6",children:e.jsx("div",{className:"bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm",children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"p-2 bg-amber-100 rounded-xl",children:e.jsx(x,{className:"w-5 h-5 text-amber-600"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-sm font-semibold text-amber-900 mb-2",children:"Upcoming Appointments"}),e.jsx("div",{className:"space-y-1",children:H.map((t,s)=>e.jsx("p",{className:"text-sm text-amber-800",children:t},s))})]}),e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>I([]),className:"p-2 h-8 w-8 rounded-full hover:bg-amber-100 text-amber-600 hover:text-amber-800",children:"×"})]})})}),e.jsx("div",{className:" mx-auto px-6 py-6",children:e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-12 gap-6",children:[e.jsx("div",{className:"xl:col-span-9",children:e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-white to-slate-50 border-b border-slate-100 p-6",children:e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-1",children:[e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>Y("prev"),className:"h-10 w-10 rounded-xl hover:bg-slate-100",children:e.jsx(Xe,{className:"w-4 h-4"})}),e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>Y("today"),className:"px-6 h-10 rounded-xl font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors",children:"Today"}),e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>Y("next"),className:"h-10 w-10 rounded-xl hover:bg-slate-100",children:e.jsx(Ke,{className:"w-4 h-4"})})]}),e.jsx("div",{className:"px-4",children:e.jsx("h2",{className:"text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",children:ze()})})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 rounded-2xl p-1",children:[{view:d.DAY,label:"Day",icon:x},{view:d.WEEK,label:"Week",icon:x},{view:d.MONTH,label:"Month",icon:x},{view:d.AGENDA,label:"Agenda",icon:x}].map(({view:t,label:s,icon:r})=>e.jsxs(m,{variant:p===t?"default":"ghost",size:"sm",onClick:()=>B(t),className:`h-10 px-6 rounded-xl font-medium transition-all duration-200 ${p===t?"bg-white shadow-sm text-slate-900 hover:bg-white":"hover:bg-white/60 text-slate-600 hover:text-slate-900"}`,children:[e.jsx(r,{className:"w-4 h-4 mr-2"}),s]},t))})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"h-[700px] bg-white rounded-2xl shadow-inner border border-slate-100 overflow-hidden",children:e.jsx(Oe,{localizer:Je,events:Ye,startAccessor:"start",endAccessor:"end",view:p,onView:B,date:$,onNavigate:F,onSelectEvent:Te,onSelectSlot:_e,selectable:!0,eventPropGetter:Be,components:{event:Fe,toolbar:()=>null},style:{height:"100%"},formats:{timeGutterFormat:"HH:mm",eventTimeRangeFormat:({start:t,end:s})=>`${g(t).format("HH:mm")} - ${g(s).format("HH:mm")}`,dayFormat:"ddd DD/MM",dateFormat:"DD",dayHeaderFormat:"dddd DD/MM/YYYY",dayRangeHeaderFormat:({start:t,end:s})=>`${g(t).format("DD/MM")} - ${g(s).format("DD/MM/YYYY")}`,agendaDateFormat:"dddd DD/MM/YYYY",agendaTimeFormat:"HH:mm",agendaTimeRangeFormat:({start:t,end:s})=>`${g(t).format("HH:mm")} - ${g(s).format("HH:mm")}`},min:new Date(2025,0,1,0,0,0),max:new Date(2025,0,1,23,59,59),step:15,timeslots:4,showMultiDayTimes:!0,popup:!0,popupOffset:30})})})]})}),e.jsxs("div",{className:"xl:col-span-3 space-y-6",children:[e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-xl",children:e.jsx(Ne,{className:"w-5 h-5 text-blue-600"})}),e.jsx("h3",{className:"text-lg font-bold text-blue-900",children:"Upcoming"})]})}),e.jsx("div",{className:"p-6",children:V.length===0?e.jsxs("div",{className:"text-center py-8",children:[e.jsx("div",{className:"p-4 bg-slate-50 rounded-2xl mx-auto w-fit mb-4",children:e.jsx(x,{className:"w-8 h-8 text-slate-400"})}),e.jsx("p",{className:"text-slate-500 font-medium",children:"No upcoming appointments"})]}):e.jsx("div",{className:"space-y-3",children:V.slice(0,4).map(t=>e.jsxs("div",{className:"group relative bg-gradient-to-r from-slate-50 to-white rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer",onClick:()=>G(t),children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:"flex items-start justify-between mb-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx("h4",{className:"font-semibold text-slate-900 mb-1 group-hover:text-blue-900 transition-colors",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 font-medium",children:t.ticket.user.name})]}),e.jsx("div",{className:"flex items-center gap-2",children:(v||u)&&t.status==="scheduled"&&e.jsxs(m,{size:"sm",onClick:s=>{s.stopPropagation(),T("start",t.id)},className:"h-8 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium shadow-sm",children:[e.jsx(A,{className:"w-3 h-3 mr-1"}),"Start"]})})]}),e.jsxs("div",{className:"flex items-center gap-4 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-1 text-slate-500",children:[e.jsx(Ne,{className:"w-3 h-3"}),C(t.scheduled_for)]}),e.jsxs("div",{className:"flex items-center gap-1 text-slate-500",children:[e.jsx(k,{className:"w-3 h-3"}),t.technical.name]})]})]})]},t.id))})})]}),e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-emerald-100 rounded-xl",children:e.jsx(ke,{className:"w-5 h-5 text-emerald-600"})}),e.jsx("h3",{className:"text-lg font-bold text-emerald-900",children:"Statistics"})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"space-y-4",children:[{label:"Total",count:c.length,color:"text-slate-600"},{label:"Scheduled",count:c.filter(t=>t.status==="scheduled").length,color:"text-blue-600"},{label:"In Progress",count:c.filter(t=>t.status==="in_progress").length,color:"text-yellow-600"},{label:"Completed",count:c.filter(t=>t.status==="completed").length,color:"text-green-600"},{label:"No Show",count:c.filter(t=>t.status==="no_show").length,color:"text-orange-600"},{label:"Cancelled",count:c.filter(t=>t.status==="cancelled").length,color:"text-red-600"}].map(t=>e.jsxs("div",{className:"flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100",children:[e.jsxs("span",{className:"text-sm font-medium text-slate-700",children:[t.label,":"]}),e.jsx("span",{className:`text-lg font-bold ${t.color}`,children:t.count})]},t.label))})})]}),e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-purple-50 to-violet-50 p-6 border-b border-purple-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-purple-100 rounded-xl",children:e.jsx(k,{className:"w-5 h-5 text-purple-600"})}),e.jsx("h3",{className:"text-lg font-bold text-purple-900",children:"Team"})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"space-y-3",children:De.map(t=>e.jsxs("div",{className:"flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200",children:[e.jsx("div",{className:"w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm",children:t.name.charAt(0).toUpperCase()}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"font-semibold text-slate-900 text-sm",children:t.name}),e.jsx("p",{className:"text-xs text-slate-500",children:t.email})]}),e.jsx(ge,{variant:"outline",className:"text-xs bg-green-50 text-green-700 border-green-200 px-2 py-1 rounded-lg",children:"Available"})]},t.id))})})]})]})]})}),e.jsx(ue,{open:o.open,onOpenChange:t=>w({open:t,appointment:o.appointment}),children:e.jsxs(ve,{className:"sm:max-w-4xl max-h-[95vh] overflow-y-auto",children:[e.jsx(we,{className:"pb-6 border-b border-slate-200",children:e.jsxs(je,{className:"flex items-center gap-3 text-2xl font-bold",children:[e.jsx("div",{className:"p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg",children:e.jsx(x,{className:"w-7 h-7 text-white"})}),e.jsxs("div",{children:[e.jsx("div",{children:"Appointment Details"}),e.jsx("div",{className:"text-sm font-normal text-slate-600 mt-1",children:"Manage and track appointment progress"})]})]})}),e.jsx("div",{className:"max-h-[70vh] overflow-y-auto pr-2",children:o.appointment&&e.jsxs("div",{className:"space-y-8",children:[e.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm",children:[e.jsx("div",{className:"flex items-start justify-between mb-6",children:e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-xl font-bold text-slate-900 mb-2",children:o.appointment.title}),e.jsx("div",{className:"flex items-center gap-2",children:Ie(o.appointment.status)})]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-lg",children:e.jsx(x,{className:"w-5 h-5 text-blue-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Scheduled Date & Time"}),e.jsx("div",{className:"text-base font-semibold text-slate-900",children:He(o.appointment.scheduled_for)}),e.jsx("div",{className:"text-sm text-slate-600",children:C(o.appointment.scheduled_for)})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-green-100 rounded-lg",children:e.jsx(M,{className:"w-5 h-5 text-green-600"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Location"}),e.jsx("div",{className:"text-base font-semibold text-slate-900",children:(()=>{var a,l,i,b,h,j,N,Z,ee,te,se,re,ae,oe,ne,le,ie,de,ce,me,xe,pe,be,fe,he;const t=o.appointment;console.log("DEBUG - Full appointment object:",t),console.log("DEBUG - Ticket object:",t==null?void 0:t.ticket),console.log("DEBUG - Device object:",(a=t==null?void 0:t.ticket)==null?void 0:a.device),console.log("DEBUG - Device tenants:",(i=(l=t==null?void 0:t.ticket)==null?void 0:l.device)==null?void 0:i.tenants),console.log("DEBUG - User tenant:",(h=(b=t==null?void 0:t.ticket)==null?void 0:b.user)==null?void 0:h.tenant);const s=((se=(te=(ee=(Z=(N=(j=t==null?void 0:t.ticket)==null?void 0:j.device)==null?void 0:N.tenants)==null?void 0:Z[0])==null?void 0:ee.apartment)==null?void 0:te.building)==null?void 0:se.name)||((le=(ne=(oe=(ae=(re=t==null?void 0:t.ticket)==null?void 0:re.user)==null?void 0:ae.tenant)==null?void 0:oe.apartment)==null?void 0:ne.building)==null?void 0:le.name)||"Building not specified",r=((xe=(me=(ce=(de=(ie=t==null?void 0:t.ticket)==null?void 0:ie.device)==null?void 0:de.tenants)==null?void 0:ce[0])==null?void 0:me.apartment)==null?void 0:xe.name)||((he=(fe=(be=(pe=t==null?void 0:t.ticket)==null?void 0:pe.user)==null?void 0:be.tenant)==null?void 0:fe.apartment)==null?void 0:he.name);let n=s;return r&&(n+=` - ${r}`),n})()}),o.appointment.address&&e.jsx("div",{className:"text-sm text-slate-600 mt-1",children:o.appointment.address})]}),(()=>{var r,n,a,l,i,b,h,j,N;const t=o.appointment,s=((i=(l=(a=(n=(r=t==null?void 0:t.ticket)==null?void 0:r.device)==null?void 0:n.tenants)==null?void 0:a[0])==null?void 0:l.apartment)==null?void 0:i.building)||((N=(j=(h=(b=t==null?void 0:t.ticket)==null?void 0:b.user)==null?void 0:h.tenant)==null?void 0:j.apartment)==null?void 0:N.building);return s!=null&&s.location_link?e.jsx(m,{variant:"ghost",size:"sm",onClick:()=>R({open:!0,building:s}),className:"ml-2 p-2 h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200",title:"View on Map",children:e.jsx(M,{className:"w-4 h-4 text-red-600"})}):null})()]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-purple-100 rounded-lg",children:e.jsx(k,{className:"w-5 h-5 text-purple-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Assigned Technician"}),e.jsx("div",{className:"text-base font-semibold text-slate-900",children:((K=o.appointment.technical)==null?void 0:K.name)||"Not assigned"})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-orange-100 rounded-lg",children:e.jsx(x,{className:"w-5 h-5 text-orange-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Related Ticket"}),e.jsxs("div",{className:"text-base font-semibold text-slate-900",children:["#",((X=o.appointment.ticket)==null?void 0:X.code)||"N/A"]})]})]})]})]}),o.appointment.description&&e.jsxs("div",{className:"mt-6 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("h4",{className:"text-sm font-medium text-slate-600 mb-2",children:"Description"}),e.jsx("p",{className:"text-slate-900",children:o.appointment.description})]}),o.appointment.member_instructions&&e.jsxs("div",{className:"mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100",children:[e.jsx("h4",{className:"text-sm font-medium text-blue-600 mb-2",children:"Instructions"}),e.jsx("p",{className:"text-blue-700",children:o.appointment.member_instructions})]}),o.appointment.completion_notes&&e.jsxs("div",{className:"mt-6 p-4 bg-green-50 rounded-xl border border-green-100",children:[e.jsx("h4",{className:"text-sm font-medium text-green-600 mb-2",children:"Completion Notes"}),e.jsx("p",{className:"text-green-700",children:o.appointment.completion_notes})]})]}),(v||u||Se)&&o.appointment.status==="scheduled"&&e.jsxs("div",{className:"bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-6",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-lg",children:e.jsx(A,{className:"w-6 h-6 text-blue-600"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-bold text-blue-900",children:"Visit Actions"}),e.jsx("p",{className:"text-sm text-blue-700",children:"Start your visit or mark as no show"})]})]}),e.jsxs("div",{className:"flex gap-4",children:[e.jsxs(m,{onClick:()=>{T("start",o.appointment.id),w({open:!1})},className:"flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold",children:[e.jsx(A,{className:"w-5 h-5 mr-2"}),"Start Visit"]}),e.jsxs(m,{variant:"outline",onClick:()=>{T("no-show",o.appointment.id),w({open:!1})},className:"flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 py-3 px-6 rounded-xl font-semibold",children:[e.jsx(k,{className:"w-5 h-5 mr-2"}),"Mark as No Show"]})]})]})]})}),e.jsx(Ve,{className:"pt-6 border-t border-slate-200",children:e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(m,{variant:"outline",onClick:()=>{var t,s;return window.location.href=`/tickets?ticket=${(s=(t=o.appointment)==null?void 0:t.ticket)==null?void 0:s.id}`},className:"flex-1",children:"View Ticket"}),e.jsx(m,{onClick:()=>w({open:!1}),className:"flex-1",children:"Close"})]})})]})}),e.jsx(ue,{open:D.open,onOpenChange:t=>R({open:t}),children:e.jsxs(ve,{className:"sm:max-w-[800px]",children:[e.jsx(we,{children:e.jsxs(je,{className:"flex items-center gap-2",children:[e.jsx(M,{className:"w-5 h-5 text-red-600"}),((J=D.building)==null?void 0:J.name)||"Building Location"]})}),e.jsx("div",{className:"w-full aspect-video",children:e.jsx("iframe",{src:(Q=D.building)!=null&&Q.location_link?Ae(D.building.location_link):"",width:"100%",height:"100%",style:{border:0},allowFullScreen:!0,loading:"lazy",referrerPolicy:"no-referrer-when-downgrade",title:"Building Location"})})]})})]})]})}export{Et as default};
