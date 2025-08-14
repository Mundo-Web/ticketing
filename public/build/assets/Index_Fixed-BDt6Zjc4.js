import{j as t}from"./ui--9QRf85z.js";import{r as d}from"./recharts-B16uQ_Zp.js";import{K as ye,L as ke}from"./app-Ds2FNFH8.js";import{A as Ce}from"./app-layout-BTYIlGe4.js";import{B as u}from"./button-3fVzTxZH.js";import{v as o,C as je,m as De,h}from"./react-big-calendar-BlXibPcB.js";import{C as v,a as Ne}from"./circle-check-big-DKZvEq1H.js";import{C as de,a as Ee}from"./x-eWc-uscP.js";import{U as Ae}from"./user-B9S7Zak9.js";import{R as Fe}from"./rotate-ccw-Pe8vli6_.js";import{C as Me}from"./circle-play-Dthy1u5D.js";import{C as Se}from"./chevron-left-BEER2g75.js";import{M as Be}from"./map-pin-B6MGBFhT.js";import"./react-B1hewrmX.js";import"./index--i9LXxpm.js";import"./utils-DvwAYYBZ.js";import"./tooltip-Dm-vk6MS.js";import"./check-C_IBZmq_.js";import"./createLucideIcon-BBA9I-xQ.js";import"./index-BDFBH7XS.js";import"./index-BsIecJEN.js";import"./index-Df3HipqK.js";import"./chevrons-up-down-DaqTssCh.js";import"./memoize-one.esm-C_vqz2--.js";const Ye=De(h),Ue=`
.rbc-calendar {
    font-family: 'Inter', 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(228, 228, 231, 0.8);
}

.rbc-header {
    background: linear-gradient(135deg, #D8B16F 0%, #C2A26A 50%, #9C8458 100%);
    color: #ffffff;
    border: none;
    padding: 20px 16px;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
}

.rbc-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.rbc-header + .rbc-header {
    border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.rbc-today {
    background: linear-gradient(135deg, rgba(216, 177, 111, 0.15) 0%, rgba(194, 162, 106, 0.1) 100%);
    border-radius: 12px;
    position: relative;
}

.rbc-today::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(216, 177, 111, 0.1), transparent, rgba(216, 177, 111, 0.1));
    border-radius: 12px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}

.rbc-date-cell {
    padding: 16px 12px;
    border-right: 1px solid rgba(228, 228, 231, 0.6);
    font-weight: 600;
    color: #374151;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.rbc-date-cell:hover {
    background: linear-gradient(135deg, #F9F6F0 0%, #F5F2EC 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.rbc-off-range-bg {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.rbc-off-range {
    color: #9ca3af;
    opacity: 0.6;
}

.rbc-current-time-indicator {
    background: linear-gradient(90deg, #D8B16F 0%, #C2A26A 100%);
    height: 3px;
    z-index: 10;
    box-shadow: 0 0 10px rgba(216, 177, 111, 0.5);
    border-radius: 2px;
}

.rbc-time-slot {
    border-top: 1px solid rgba(228, 228, 231, 0.4);
    min-height: 32px;
    transition: all 0.2s ease;
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
}

.rbc-time-slot:hover {
    background: linear-gradient(135deg, rgba(216, 177, 111, 0.08) 0%, rgba(216, 177, 111, 0.03) 100%);
    transform: scale(1.01);
}

.rbc-timeslot-group {
    border-bottom: 1px solid rgba(228, 228, 231, 0.4);
    min-height: 64px;
}

.rbc-time-gutter .rbc-timeslot-group {
    border-right: 1px solid rgba(228, 228, 231, 0.4);
}

.rbc-time-header-gutter {
    background: linear-gradient(135deg, #D8B16F 0%, #C2A26A 100%);
    border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.rbc-time-gutter {
    background: linear-gradient(135deg, #F9F6F0 0%, #F5F2EC 100%);
    border-right: 1px solid rgba(228, 228, 231, 0.4);
}

.rbc-time-slot-time {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    padding: 6px 12px;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.rbc-day-slot .rbc-event, .rbc-week-view .rbc-event {
    border: none;
    border-radius: 12px;
    margin: 2px 3px;
    padding: 0;
    min-height: 75px !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
}

.rbc-event {
    border-radius: 12px;
    border: none !important;
    color: white !important;
    font-size: 12px;
    padding: 0 !important;
    overflow: hidden !important;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1);
    position: relative;
}

.rbc-event::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.rbc-event:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2);
    z-index: 1000;
}

.rbc-event:hover::before {
    opacity: 1;
}

.rbc-event:focus {
    outline: 3px solid rgba(216, 177, 111, 0.5);
    outline-offset: 3px;
}

.rbc-month-view {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border-radius: 20px;
    overflow: hidden;
}

.rbc-month-row {
    border-bottom: 1px solid rgba(228, 228, 231, 0.4);
}

.rbc-month-row:last-child {
    border-bottom: none;
}

.rbc-date-cell a {
    color: #374151;
    font-weight: 700;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
    position: relative;
    overflow: hidden;
}

.rbc-date-cell a::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(216, 177, 111, 0.4), transparent);
    transition: left 0.5s;
}

.rbc-date-cell a:hover {
    background: linear-gradient(135deg, #D8B16F 0%, #C2A26A 100%);
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(216, 177, 111, 0.4);
}

.rbc-date-cell a:hover::before {
    left: 100%;
}

.rbc-date-cell.rbc-today a {
    background: linear-gradient(135deg, #D8B16F 0%, #C2A26A 100%);
    color: #ffffff;
    box-shadow: 0 4px 15px rgba(216, 177, 111, 0.4);
}

.rbc-agenda-view {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border-radius: 20px;
    overflow: hidden;
}

.rbc-agenda-view table.rbc-agenda-table {
    font-size: 14px;
    width: 100%;
}

.rbc-agenda-view .rbc-agenda-content {
    padding: 20px;
}

.rbc-agenda-view .rbc-event {
    background: none !important;
    border: none !important;
    color: inherit !important;
    min-height: auto;
    padding: 16px 20px;
    border-radius: 12px;
    margin: 6px 0;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-left: 4px solid #D8B16F !important;
    background: linear-gradient(135deg, #F9F6F0 0%, #F5F2EC 100%) !important;
    position: relative;
    overflow: hidden;
}

.rbc-agenda-view .rbc-event::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.rbc-agenda-view .rbc-event:hover {
    transform: translateX(8px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, #F5F2EC 0%, #E8DCC6 100%) !important;
    border-left-width: 6px !important;
}

.rbc-agenda-view .rbc-event:hover::before {
    opacity: 1;
}

.rbc-agenda-date-cell {
    background: linear-gradient(135deg, #F9F6F0 0%, #F5F2EC 100%);
    font-weight: 700;
    color: #374151;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(228, 228, 231, 0.4);
    position: relative;
}

.rbc-agenda-time-cell {
    background: linear-gradient(135deg, #F5F2EC 0%, #E8DCC6 100%);
    font-weight: 600;
    color: #6b7280;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(228, 228, 231, 0.4);
    font-size: 13px;
}

.rbc-agenda-event-cell {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(228, 228, 231, 0.4);
}

/* Week view improvements */
.rbc-time-view {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border-radius: 20px;
    overflow: hidden;
}

.rbc-time-header {
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    border-bottom: 2px solid rgba(228, 228, 231, 0.4);
}

.rbc-time-content {
    border: none;
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
}

.rbc-allday-cell {
    background: linear-gradient(135deg, #F9F6F0 0%, #F5F2EC 100%);
    border-bottom: 3px solid rgba(216, 177, 111, 0.3);
    padding: 8px 0;
}

.rbc-row-content {
    border-bottom: 1px solid rgba(228, 228, 231, 0.4);
}

/* Enhanced scrollbar */
.rbc-time-content::-webkit-scrollbar {
    width: 12px;
}

.rbc-time-content::-webkit-scrollbar-track {
    background: linear-gradient(135deg, #E8DCC6 0%, #D8B16F 100%);
    border-radius: 10px;
}

.rbc-time-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #C2A26A 0%, #9C8458 100%);
    border-radius: 10px;
    border: 2px solid #E8DCC6;
}

.rbc-time-content::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #9C8458 0%, #7A6B47 100%);
}

/* Custom Event Content Styling - Enhanced */
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
    font-weight: 700 !important;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.custom-event-content .event-client {
    color: #ffffff !important;
    font-weight: 800 !important;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.custom-event-content .event-title {
    color: #ffffff !important;
    font-weight: 600 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.custom-event-content .event-location {
    color: #ffffff !important;
    opacity: 0.95 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.custom-event-content svg {
    color: #ffffff !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* Loading animation for events */
@keyframes eventLoad {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
}

.rbc-event {
    animation: eventLoad 0.3s ease-out;
}

/* Improved responsiveness */
@media (max-width: 768px) {
    .rbc-calendar {
        border-radius: 16px;
    }
    
    .rbc-header {
        padding: 12px 8px;
        font-size: 11px;
    }
    
    .rbc-time-slot-time {
        font-size: 10px;
        padding: 4px 8px;
    }
    
    .rbc-event {
        border-radius: 8px;
        min-height: 50px !important;
    }
}
`,j={scheduled:{label:"Scheduled",color:"bg-blue-100 text-blue-800",bgColor:"#3B82F6",icon:v},in_progress:{label:"In Progress",color:"bg-yellow-100 text-yellow-800",bgColor:"#F59E0B",icon:Me},completed:{label:"Completed",color:"bg-green-100 text-green-800",bgColor:"#10B981",icon:Ne},cancelled:{label:"Cancelled",color:"bg-red-100 text-red-800",bgColor:"#EF4444",icon:de},rescheduled:{label:"Rescheduled",color:"bg-purple-100 text-purple-800",bgColor:"#8B5CF6",icon:Fe},no_show:{label:"No Show",color:"bg-orange-100 text-orange-800",bgColor:"#F97316",icon:Ae}};function ut({appointments:ce,technicals:$e,auth:w,isTechnicalDefault:p,googleMapsApiKey:ze}){var M,S,B,Y;const[Te,Ge]=d.useState(null),[Le,Ie]=d.useState(!1),{props:He}=ye(),m=(S=(M=w.user)==null?void 0:M.roles)==null?void 0:S.includes("technical");(Y=(B=w.user)==null?void 0:B.roles)==null||Y.includes("super-admin");const ge=m||p?o.AGENDA:o.DAY,[s,D]=d.useState(ge),[y,N]=d.useState(new Date),[E,A]=d.useState([]),[Re,_e]=d.useState(!1),[Oe,k]=d.useState({open:!1}),[We,Ke]=d.useState({open:!1}),be=async r=>{console.log("fetchFullAppointmentData called with ID:",r);try{const e=await fetch(`/appointments/${r}/details`);if(console.log("API response status:",e.status),e.ok){const a=await e.json();return console.log("Received appointment data:",a),a.appointment}else console.error("API response not ok:",e.status,e.statusText)}catch(e){console.error("Error fetching appointment details:",e)}return null},pe=async(r,e="view")=>{var i,l,n,b;if(console.log("openAppointmentModal called with:",{appointment:r,action:e}),(l=(i=r==null?void 0:r.ticket)==null?void 0:i.device)!=null&&l.tenants||(b=(n=r==null?void 0:r.ticket)==null?void 0:n.user)!=null&&b.tenant){console.log("Using existing appointment data - has relationships"),k({open:!0,appointment:r});return}console.log("Fetching full appointment data for ID:",r.id);const a=await be(r.id);a?(console.log("Successfully fetched full appointment data:",a),k({open:!0,appointment:a})):(console.log("Failed to fetch full appointment data, using fallback"),k({open:!0,appointment:r}))},f=ce;d.useEffect(()=>{const r=()=>{const a=new Date,i=new Date(a.getTime()+30*60*1e3);f.forEach(l=>{if(l.status==="scheduled"){const n=new Date(l.scheduled_for);if(n<=i&&n>a){const b=Math.floor((n.getTime()-a.getTime())/6e4),c=m||p?`🔔 You have an appointment in ${b} minutes with ${l.ticket.user.name}: ${l.title}`:`Upcoming appointment in ${b} minutes: ${l.title}`;A(g=>g.includes(c)?g:[...g,c])}}})};r();const e=setInterval(r,6e4);return()=>clearInterval(e)},[f,m,p]);const me=r=>j[r]||j.scheduled,fe=d.useMemo(()=>f.map(e=>{const a=new Date(e.scheduled_for),i=new Date(a.getTime()+e.estimated_duration*6e4);return{id:e.id,title:`${e.ticket.user.name} - ${e.title}`,start:a,end:i,resource:e,allDay:!1}}),[f]),xe=r=>{pe(r.resource)},ue=r=>{console.log("Selected slot:",r)},C=r=>{let e=new Date(y);switch(r){case"prev":s===o.DAY?e.setDate(e.getDate()-1):s===o.WEEK?e.setDate(e.getDate()-7):s===o.MONTH&&e.setMonth(e.getMonth()-1);break;case"next":s===o.DAY?e.setDate(e.getDate()+1):s===o.WEEK?e.setDate(e.getDate()+7):s===o.MONTH&&e.setMonth(e.getMonth()+1);break;case"today":e=new Date;break}N(e)},he=()=>{const r=h(y);switch(s){case o.DAY:return r.format("dddd, MMMM Do YYYY");case o.WEEK:{const e=r.clone().startOf("week"),a=r.clone().endOf("week");return`${e.format("MMM Do")} - ${a.format("MMM Do, YYYY")}`}case o.MONTH:return r.format("MMMM YYYY");case o.AGENDA:return"Agenda View";default:return r.format("MMMM YYYY")}},ve=r=>({style:{border:"none",borderRadius:"12px",padding:"0",backgroundColor:"transparent",overflow:"visible"}}),we=({event:r})=>{const e=r.resource,a=me(e.status),i=a.icon,l=()=>{var U,$,z,T,G,L,I,H,R,_,O,W,K,P,V,X,q,J,Q,Z,ee,te,re,ae,oe,ne,se,ie,le;console.log("DEBUG Calendar Event - Full appointment:",e),console.log("DEBUG Calendar Event - Ticket:",e==null?void 0:e.ticket),console.log("DEBUG Calendar Event - Device:",(U=e==null?void 0:e.ticket)==null?void 0:U.device),console.log("DEBUG Calendar Event - Device tenants:",(z=($=e==null?void 0:e.ticket)==null?void 0:$.device)==null?void 0:z.tenants),console.log("DEBUG Calendar Event - User tenant:",(G=(T=e==null?void 0:e.ticket)==null?void 0:T.user)==null?void 0:G.tenant),console.log("DEBUG Calendar Event - Address:",e==null?void 0:e.address);const n=((I=(L=e==null?void 0:e.ticket)==null?void 0:L.device)==null?void 0:I.tenants)&&e.ticket.device.tenants.length>0,b=(R=(H=e==null?void 0:e.ticket)==null?void 0:H.user)==null?void 0:R.tenant;if(!n&&!b)return console.log("DEBUG Calendar Event - Missing relations, showing loading message"),"Cargando ubicación...";const c=((V=(P=(K=(W=(O=(_=e==null?void 0:e.ticket)==null?void 0:_.device)==null?void 0:O.tenants)==null?void 0:W[0])==null?void 0:K.apartment)==null?void 0:P.building)==null?void 0:V.name)||((Z=(Q=(J=(q=(X=e==null?void 0:e.ticket)==null?void 0:X.user)==null?void 0:q.tenant)==null?void 0:J.apartment)==null?void 0:Q.building)==null?void 0:Z.name),g=((oe=(ae=(re=(te=(ee=e==null?void 0:e.ticket)==null?void 0:ee.device)==null?void 0:te.tenants)==null?void 0:re[0])==null?void 0:ae.apartment)==null?void 0:oe.name)||((le=(ie=(se=(ne=e==null?void 0:e.ticket)==null?void 0:ne.user)==null?void 0:se.tenant)==null?void 0:ie.apartment)==null?void 0:le.name);if(console.log("DEBUG Calendar Event - Building found:",c),console.log("DEBUG Calendar Event - Apartment found:",g),c&&g){const x=`${c} - Apt. ${g}`;return console.log("DEBUG Calendar Event - Returning building + apartment:",x),x}if(c)return console.log("DEBUG Calendar Event - Returning building only:",c),c;if(g){const x=`Apartamento ${g}`;return console.log("DEBUG Calendar Event - Returning apartment only:",x),x}return e!=null&&e.address&&e.address.trim()!==""?(console.log("DEBUG Calendar Event - Returning address:",e.address),e.address):(console.log("DEBUG Calendar Event - No location found, returning fallback"),"Ubicación pendiente")};return t.jsxs("div",{className:"group relative w-full h-full overflow-hidden cursor-pointer transition-all duration-300 ease-out custom-event-content",style:{minHeight:"100%",height:"100%",borderRadius:"12px",background:`linear-gradient(135deg, ${a.bgColor} 0%, ${a.bgColor}dd 100%)`,border:"none",boxShadow:"0 8px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)",display:"flex",flexDirection:"column",justifyContent:"flex-start",color:"#ffffff",backdropFilter:"blur(10px)"},title:`${e.ticket.user.name} - ${e.title} at ${F(e.scheduled_for)}`,children:[t.jsx("div",{className:"absolute left-0 top-0 w-1.5 h-full rounded-l-lg",style:{background:"linear-gradient(180deg, #FDFCFB 0%, rgba(255, 255, 255, 0.8) 100%)",opacity:.9}}),t.jsx("div",{className:"absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 transform -skew-x-12"}),t.jsxs("div",{className:"p-3 flex-1 relative z-10",style:{backgroundColor:"transparent"},children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsxs("div",{className:"flex items-center gap-1.5",children:[t.jsx(i,{className:"w-3.5 h-3.5 opacity-90 drop-shadow-md"}),t.jsx("span",{className:"font-bold text-xs tracking-wider event-time bg-black bg-opacity-20 px-2 py-1 rounded-md",children:F(e.scheduled_for)})]}),t.jsx("div",{className:"w-2.5 h-2.5 bg-white bg-opacity-90 rounded-full shadow-md animate-pulse"})]}),t.jsx("div",{className:"font-bold text-sm leading-tight mb-2 drop-shadow-md event-client",children:e.ticket.user.name}),t.jsx("div",{className:"text-xs leading-tight mb-2 opacity-95 font-semibold event-title",children:e.title.length>28?e.title.substring(0,28)+"...":e.title}),t.jsxs("div",{className:"flex items-center gap-1.5 text-xs opacity-95 leading-tight event-location bg-black bg-opacity-20 rounded-md px-2 py-1",children:[t.jsx(Be,{className:"w-3 h-3 flex-shrink-0 drop-shadow-md"}),t.jsx("span",{className:"truncate font-medium",children:(()=>{const n=l();return n&&n.length>22?n.substring(0,22)+"...":n})()})]})]}),t.jsx("div",{className:"absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-15 transition-all duration-300 rounded-lg"}),t.jsx("div",{className:"absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent opacity-20 rounded-b-lg"})]})};f.filter(r=>{const e=new Date(r.scheduled_for),a=new Date,i=new Date(a.getTime()+7*24*60*60*1e3);return e>=a&&e<=i&&r.status==="scheduled"}).sort((r,e)=>new Date(r.scheduled_for).getTime()-new Date(e.scheduled_for).getTime());const F=r=>new Date(r).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});return t.jsxs(Ce,{breadcrumbs:[{title:"Calendar",href:"/appointments"}],children:[t.jsx(ke,{title:"Appointments Calendar"}),t.jsx("style",{dangerouslySetInnerHTML:{__html:Ue}}),t.jsx("div",{className:"min-h-screen bg-gradient-to-br from-gray-50 to-gray-100",children:t.jsxs("div",{className:"flex flex-col gap-8 p-8",children:[E.length>0&&t.jsx("div",{className:"bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-r-2xl shadow-xl p-6 mb-6 backdrop-blur-sm",children:t.jsxs("div",{className:"flex items-start gap-4",children:[t.jsx("div",{className:"p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl shadow-md",children:t.jsx(v,{className:"w-6 h-6 text-amber-700"})}),t.jsxs("div",{className:"flex-1",children:[t.jsx("h3",{className:"text-lg font-bold text-amber-900 mb-2",children:"🔔 Upcoming Appointments"}),t.jsx("div",{className:"space-y-2",children:E.map((r,e)=>t.jsx("div",{className:"bg-white bg-opacity-70 rounded-lg p-3 backdrop-blur-sm shadow-sm",children:t.jsx("p",{className:"text-sm font-medium text-amber-800",children:r})},e))})]}),t.jsx(u,{variant:"ghost",size:"sm",onClick:()=>A([]),className:"text-amber-600 hover:text-amber-800 hover:bg-amber-200 rounded-xl p-2 transition-all duration-200",children:t.jsx(de,{className:"w-5 h-5"})})]})}),t.jsx("div",{className:"bg-gradient-to-r from-primary via-primary to-primary/90 rounded-3xl p-8 text-primary-foreground shadow-2xl backdrop-blur-sm border border-white/20",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center gap-6",children:[t.jsx("div",{className:"p-5 bg-gradient-to-br from-white/20 to-white/10 rounded-3xl backdrop-blur-md shadow-lg",children:t.jsx(v,{className:"w-8 h-8"})}),t.jsxs("div",{children:[t.jsx("h1",{className:"text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent",children:m||p?"My Appointments":"Appointments Calendar"}),t.jsx("p",{className:"mt-2 text-lg opacity-90 font-medium",children:m||p?`Welcome back, ${w.user.name}. Manage your scheduled visits.`:"Comprehensive view of all scheduled appointments"})]})]}),t.jsx("div",{className:"hidden lg:flex gap-3",children:Object.entries(j).slice(0,4).map(([r,e])=>{const a=e.icon;return t.jsxs("div",{className:"flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-3 shadow-lg border border-white/30",children:[t.jsx("div",{className:"w-3 h-3 rounded-full shadow-md",style:{backgroundColor:e.bgColor}}),t.jsx(a,{className:"w-4 h-4 opacity-90"}),t.jsx("span",{className:"text-sm font-semibold",children:e.label})]},r)})})]})}),t.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-4 gap-8",children:[t.jsx("div",{className:"xl:col-span-3",children:t.jsxs("div",{className:"bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50",children:[t.jsx("div",{className:"bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50 p-6 backdrop-blur-sm",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center gap-4",children:[t.jsx("div",{className:"p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl shadow-md",children:t.jsx(v,{className:"w-6 h-6 text-primary"})}),t.jsxs("div",{children:[t.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Calendar View"}),t.jsx("p",{className:"text-sm text-gray-600 font-medium",children:he()})]})]}),t.jsx("div",{className:"flex items-center gap-3",children:t.jsxs("div",{className:"flex items-center bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50",children:[t.jsx(u,{variant:"ghost",size:"sm",onClick:()=>C("prev"),className:"h-12 px-4 hover:bg-gray-100/70 rounded-l-2xl border-r border-gray-200/50 transition-all duration-200",children:t.jsx(Se,{className:"w-5 h-5"})}),t.jsx(u,{variant:"ghost",size:"sm",onClick:()=>C("today"),className:"h-12 px-8 hover:bg-primary/10 hover:text-primary font-bold transition-all duration-200",children:"Today"}),t.jsx(u,{variant:"ghost",size:"sm",onClick:()=>C("next"),className:"h-12 px-4 hover:bg-gray-100/70 rounded-r-2xl border-l border-gray-200/50 transition-all duration-200",children:t.jsx(Ee,{className:"w-5 h-5"})})]})}),t.jsx("div",{className:"flex items-center bg-gray-100/70 backdrop-blur-md rounded-2xl p-1.5 shadow-lg",children:["DAY","WEEK","MONTH","AGENDA"].map(r=>t.jsx(u,{variant:s===o[r]?"default":"ghost",size:"sm",onClick:()=>D(o[r]),className:`h-9 px-5 text-xs font-bold transition-all duration-300 ${s===o[r]?"bg-primary text-primary-foreground shadow-lg scale-105":"text-gray-600 hover:text-gray-900 hover:bg-white/50"}`,children:r==="DAY"?"Day":r==="WEEK"?"Week":r==="MONTH"?"Month":"Agenda"},r))})]})}),t.jsx("div",{className:"p-8",children:t.jsx("div",{className:"h-[700px] bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-inner",children:t.jsx(je,{localizer:Ye,events:fe,startAccessor:"start",endAccessor:"end",view:s,onView:D,date:y,onNavigate:N,onSelectEvent:xe,onSelectSlot:ue,selectable:!0,eventPropGetter:ve,components:{event:we,toolbar:()=>null},style:{height:"100%",fontFamily:"Inter, inherit"},formats:{timeGutterFormat:"HH:mm",eventTimeRangeFormat:({start:r,end:e})=>`${h(r).format("HH:mm")} - ${h(e).format("HH:mm")}`,dayHeaderFormat:"dddd MMM Do"},min:new Date(2025,0,1,6,0,0),max:new Date(2025,0,1,22,0,0),step:15,timeslots:4,showMultiDayTimes:!0,popup:!0,popupOffset:30,dayLayoutAlgorithm:"no-overlap"})})})]})}),t.jsx("div",{className:"space-y-6"})]})]})})]})}export{ut as default};
