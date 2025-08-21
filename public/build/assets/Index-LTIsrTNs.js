import{j as e}from"./ui-D1w9Iw8H.js";import{r as c}from"./recharts-Dld1lWsf.js";import{K as Ke,L as Xe,S as B,t as N}from"./app-vg6vUKH9.js";import{A as Je}from"./app-layout-aweXgbFr.js";import{B as b}from"./button-BntSAybs.js";import{B as Me}from"./format-Drb4gU7T.js";import{D as I,a as R,b as U,c as O,d as Qe}from"./dialog-B7MJj1P1.js";import{v as d,C as Ze,m as et,h as g}from"./react-big-calendar-BrYY6-2y.js";import{C as x,a as Ee}from"./circle-check-big-DZU7S_eA.js";import{U as y}from"./user-CtzshXh0.js";import{R as tt}from"./rotate-ccw-DuBc0qOm.js";import{C as rt,a as st}from"./x-BL7C5EPd.js";import{C as Y}from"./circle-play-Cy8QUXnz.js";import{C as at}from"./chevron-left-BbzonqSg.js";import{C as Ae}from"./clock-BxVJL7PR.js";import{M as $}from"./map-pin-CGVzMw_j.js";import"./react-B1hewrmX.js";import"./utils-B66yfQja.js";import"./tooltip-CQHbb0yU.js";import"./check-CkciTNW-.js";import"./createLucideIcon-CR-66RMC.js";import"./index-CWijjM2R.js";import"./index-cS_AKGRi.js";import"./index-DrdTBqzy.js";import"./chevrons-up-down-BF_I81uV.js";import"./memoize-one.esm-DMzj5eV4.js";g.locale("en");const ot=et(g),nt=`
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

/* Week View Header - Force single cell appearance per day */
.rbc-time-header .rbc-header {
    border-left: none !important;
    border-right: 1px solid #e2e8f0 !important;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

.rbc-time-header .rbc-header:first-child {
    border-left: none !important;
}

.rbc-time-header .rbc-header:last-child {
    border-right: none !important;
}

/* Hide internal subdivisions in day headers */
.rbc-time-header-gutter + .rbc-header,
.rbc-time-header .rbc-header ~ .rbc-header {
    border-left: 1px solid #e2e8f0 !important;
}

/* Ensure day headers span full width without subdivisions */
.rbc-time-view .rbc-time-header {
    display: flex !important;
}

.rbc-time-view .rbc-time-header .rbc-header {
    flex: 1 !important;
    min-width: 0 !important;
}

/* Fix for rbc-row-bg - Remove internal subdivisions */
.rbc-row-bg {
    display: flex !important;
}

.rbc-row-bg .rbc-day-bg {
    border-left: 1px solid #f1f5f9 !important;
    border-right: none !important;
    flex: 1 !important;
}

.rbc-row-bg .rbc-day-bg:first-child {
    border-left: none !important;
}

.rbc-row-bg .rbc-day-bg:last-child {
    border-right: none !important;
}

/* Hide extra day-bg elements that create subdivisions */
.rbc-time-view .rbc-row-bg .rbc-day-bg + .rbc-day-bg + .rbc-day-bg {
    display: none !important;
}

.rbc-time-view .rbc-row-bg .rbc-day-bg + .rbc-day-bg:not(:last-child) {
    display: none !important;
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
    min-height: 60px;
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

/* Week View - Force single cells per hour */
.rbc-time-view .rbc-timeslot-group {
    min-height: 60px !important;
    height: 60px !important;
}

.rbc-time-view .rbc-time-slot {
    min-height: 60px !important;
    height: 60px !important;
    border-top: none !important;
}

.rbc-time-view .rbc-timeslot-group:last-child .rbc-time-slot {
    border-bottom: 1px solid #f1f5f9 !important;
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
    padding: 0px 0;
    visibility: hidden;
    display: none !important;
}

/* Fix for rbc-allday-cell - Remove internal subdivisions */
.rbc-time-view .rbc-allday-cell {
    border-left: none !important;
    border-right: 1px solid #e2e8f0 !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    display: none !important;
    flex: 1 !important;
}

.rbc-time-view .rbc-allday-cell:first-child {
    border-left: none !important;
}

.rbc-time-view .rbc-allday-cell:last-child {
    border-right: none !important;
}

/* Hide extra allday cells that create subdivisions */
.rbc-time-view .rbc-header-row .rbc-allday-cell + .rbc-allday-cell + .rbc-allday-cell {
    display: none !important;
}

.rbc-time-view .rbc-header-row .rbc-allday-cell + .rbc-allday-cell:not(:last-child) {
    display: none !important;
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
`,V={scheduled:{label:"Scheduled",color:"bg-blue-100 text-blue-800",bgColor:"#3B82F6",icon:x},in_progress:{label:"In Progress",color:"bg-yellow-100 text-yellow-800",bgColor:"#F59E0B",icon:Y},completed:{label:"Completed",color:"bg-green-100 text-green-800",bgColor:"#10B981",icon:Ee},cancelled:{label:"Cancelled",color:"bg-red-100 text-red-800",bgColor:"#EF4444",icon:rt},rescheduled:{label:"Rescheduled",color:"bg-gray-100 text-gray-800",bgColor:"#6B7280",icon:tt},no_show:{label:"No Show",color:"bg-orange-100 text-orange-800",bgColor:"#F97316",icon:y}};function Ht({appointments:Te,technicals:$e,auth:_,isTechnicalDefault:u,googleMapsApiKey:C}){var re,se,ae,oe,ne,le,ie,de;const[W,Ye]=c.useState(null),[lt,it]=c.useState(!1),{props:dt}=Ke(),v=(se=(re=_.user)==null?void 0:re.roles)==null?void 0:se.includes("technical"),_e=(oe=(ae=_.user)==null?void 0:ae.roles)==null?void 0:oe.includes("super-admin"),Fe=v||u?d.AGENDA:d.DAY,[m,G]=c.useState(Fe),[S,L]=c.useState(new Date),[P,q]=c.useState([]),[ct,K]=c.useState(!1),[l,w]=c.useState({open:!1}),[M,X]=c.useState({open:!1}),[F,A]=c.useState({open:!1}),[j,E]=c.useState({reason:"",description:"",notifyMember:!0,rescheduleOffered:!1}),[z,J]=c.useState(!1),ze=[{value:"member_not_home",label:"Member Not Home",description:"Member was not present at the scheduled time"},{value:"no_response",label:"No Response",description:"Member did not respond to door/calls"},{value:"refused_service",label:"Refused Service",description:"Member refused to allow technician entry"},{value:"wrong_time",label:"Wrong Time",description:"Member expected different time"},{value:"emergency",label:"Member Emergency",description:"Member had an emergency and could not attend"},{value:"technical_issue",label:"Technical Issue",description:"Technical problem prevented the visit"},{value:"weather",label:"Weather Conditions",description:"Weather prevented the visit"},{value:"other",label:"Other",description:"Other reason not listed above"}],He=t=>{if(!t)return"";if(t.includes("maps.app.goo.gl"))return`https://www.google.com/maps/embed/v1/place?key=${C}&q=-10.916879,-74.883391&zoom=15`;if(t.includes("/embed"))return t;if(t.includes("google.com/maps")){const r=t.match(/@([-0-9.]+),([-0-9.]+)/);if(r)return`https://www.google.com/maps/embed/v1/view?key=${C}&center=${r[1]},${r[2]}&zoom=15`;const s=t.match(/place\/([^\/]+)/);if(s)return`https://www.google.com/maps/embed/v1/place?key=${C}&q=place_id:${s[1]}`}return`https://www.google.com/maps/embed/v1/place?key=${C}&q=${encodeURIComponent(t)}`},Be=async t=>{console.log("fetchFullAppointmentData called with ID:",t);try{const r=await fetch(`/appointments/${t}/details`);if(console.log("API response status:",r.status),r.ok){const s=await r.json();return console.log("Received appointment data:",s),s.appointment}else console.error("API response not ok:",r.status,r.statusText)}catch(r){console.error("Error fetching appointment details:",r)}return null},Q=async(t,r="view")=>{var n,a,o,i;if(console.log("openAppointmentModal called with:",{appointment:t,action:r}),(a=(n=t==null?void 0:t.ticket)==null?void 0:n.device)!=null&&a.tenants||(i=(o=t==null?void 0:t.ticket)==null?void 0:o.user)!=null&&i.tenant){console.log("Using existing appointment data - has relationships"),w({open:!0,appointment:t});return}console.log("Fetching full appointment data for ID:",t.id);const s=await Be(t.id);s?(console.log("Successfully fetched full appointment data:",s),w({open:!0,appointment:s})):(console.log("Failed to fetch full appointment data, using fallback"),w({open:!0,appointment:t}))},Ie=async t=>{if(t){K(!0);try{const s=await(await fetch(`/appointments/${t}`)).json();Ye(s)}catch(r){console.error("Error refreshing appointment:",r)}finally{K(!1)}}},p=Te;c.useEffect(()=>{const t=()=>{const s=new Date,n=new Date(s.getTime()+30*60*1e3);p.forEach(a=>{if(a.status==="scheduled"){const o=new Date(a.scheduled_for);if(o<=n&&o>s){const i=Math.floor((o.getTime()-s.getTime())/6e4),h=v||u?`🔔 You have an appointment in ${i} minutes with ${a.ticket.user.name}: ${a.title}`:`Upcoming appointment in ${i} minutes: ${a.title}`;q(f=>f.includes(h)?f:[...f,h])}}})};t();const r=setInterval(t,6e4);return()=>clearInterval(r)},[p,v,u]);const Z=t=>V[t]||V.scheduled,Re=c.useMemo(()=>{const t=p.map(r=>{const s=new Date(r.scheduled_for),n=s.getHours();let a=r.estimated_duration;if(n>=18){const i=(24-n)*60-s.getMinutes();n>=22?a=Math.min(30,i-30):a=Math.min(a,i-60),a=Math.max(15,a)}const o=new Date(s.getTime()+a*6e4);return console.log("🗓️ Converting appointment:",{id:r.id,title:r.title,scheduled_for:r.scheduled_for,originalDuration:r.estimated_duration,adjustedDuration:a,start:s.toISOString(),end:o.toISOString(),startDay:s.getDate(),endDay:o.getDate(),hour:n,isNightEvent:n>=18,startsAt:s.toLocaleTimeString(),endsAt:o.toLocaleTimeString()}),{id:r.id,title:`${r.ticket.user.name} - ${r.title}`,start:s,end:o,resource:r,allDay:!1}});return console.log("🗓️ Total calendar events created:",t.length),t},[p]),Ue=t=>{Q(t.resource)},Oe=t=>{console.log("Selected slot:",t)},H=t=>{let r=new Date(S);switch(t){case"prev":m===d.DAY?r.setDate(r.getDate()-1):m===d.WEEK?r.setDate(r.getDate()-7):m===d.MONTH&&r.setMonth(r.getMonth()-1);break;case"next":m===d.DAY?r.setDate(r.getDate()+1):m===d.WEEK?r.setDate(r.getDate()+7):m===d.MONTH&&r.setMonth(r.getMonth()+1);break;case"today":r=new Date;break}L(r)},Ve=()=>{const t=g(S);switch(m){case d.DAY:return t.format("dddd, MMMM Do YYYY");case d.WEEK:{const r=t.clone().startOf("week"),s=t.clone().endOf("week");return`${r.format("MMM Do")} - ${s.format("MMM Do, YYYY")}`}case d.MONTH:return t.format("MMMM YYYY");case d.AGENDA:return"Agenda View";default:return t.format("MMMM YYYY")}},ee=async(t,r,s)=>{try{const n=t==="member_feedback"?"member-feedback":t;B.post(`/appointments/${r}/${n}`,s||{},{preserveScroll:!0,onSuccess:a=>{const o=a.props.flash||{},i={start:"Visit started successfully!",complete:"Visit completed successfully! Waiting for member feedback.",member_feedback:"Thank you for your feedback!",cancel:"Appointment cancelled successfully!",reschedule:"Appointment rescheduled successfully!","no-show":"Appointment marked as No Show successfully!"},h=o.success||o.message||i[t]||`${t} completed successfully`;N.success(h),W&&Ie(W.id)},onError:a=>{console.error(`Error ${t} appointment:`,a),typeof a=="object"&&a!==null?Object.values(a).flat().forEach(i=>{typeof i=="string"&&N.error(i)}):N.error(`Error processing ${t} action`)}})}catch(n){console.error(`Error ${t} appointment:`,n),N.error(`Error processing ${t} action`)}},We=async()=>{try{if(!F.appointment)return;J(!0),await B.post(route("appointments.no-show",F.appointment.id),{reason:j.reason,description:j.description||null}),N.success("Appointment marked as No Show successfully"),A({open:!1}),E({reason:"",description:"",notifyMember:!0,rescheduleOffered:!1}),B.reload()}catch(t){console.error("Error marking appointment as no-show:",t),N.error("Error marking appointment as no-show")}finally{J(!1)}},Ge=t=>({style:{border:"none",borderRadius:"8px",padding:"0",backgroundColor:"transparent",overflow:"visible"}}),Le=({event:t})=>{const r=t.resource,n=Z(r.status).icon,a={scheduled:"linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",in_progress:"linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",completed:"linear-gradient(135deg, #10B981 0%, #059669 100%)",cancelled:"linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",rescheduled:"linear-gradient(135deg, #6B7280 0%, #4B5563 100%)",no_show:"linear-gradient(135deg, #F97316 0%, #EA580C 100%)"};return e.jsxs("div",{className:"w-full h-full text-white text-xs p-1.5 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 relative",style:{minHeight:"100%",height:"100%",borderRadius:"6px",background:a[r.status]||a.scheduled,border:"none",boxShadow:"0 2px 8px rgba(0, 0, 0, 0.1)",display:"flex",flexDirection:"column",justifyContent:"flex-start"},title:`${r.ticket.user.name} - ${r.title} at ${T(r.scheduled_for)}`,children:[e.jsxs("div",{className:"flex items-center gap-1.5 mb-1 flex-shrink-0",children:[e.jsx(n,{className:"w-3 h-3 flex-shrink-0 opacity-90"}),e.jsx("span",{className:"font-bold text-xs leading-none",children:T(r.scheduled_for)})]}),e.jsx("div",{className:"font-semibold text-xs leading-tight mb-1 flex-shrink-0",children:r.ticket.user.name}),e.jsx("div",{className:"text-xs opacity-95 leading-tight mb-1 overflow-hidden",children:r.title}),e.jsxs("div",{className:"text-xs opacity-90 leading-tight flex-1 overflow-hidden",children:[e.jsx($,{className:"w-2 h-2 inline mr-1"}),(()=>{const o=r.address;return o&&o.length>20?o.substring(0,20)+"...":o||"No address"})()]}),e.jsx("div",{className:"absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white opacity-75 rounded-full"})]})};c.useEffect(()=>{(m===d.WEEK||m===d.DAY)&&setTimeout(()=>{const t=document.querySelector(".rbc-time-content");t&&(t.scrollTop=360,console.log("📅 Auto-scrolled to 6:00 AM in Week view"))},100)},[m,S]);const te=p.filter(t=>{const r=new Date(t.scheduled_for),s=new Date,n=new Date(s.getTime()+7*24*60*60*1e3);return r>=s&&r<=n&&t.status==="scheduled"}).sort((t,r)=>new Date(t.scheduled_for).getTime()-new Date(r.scheduled_for).getTime()),T=t=>new Date(t).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1}),Pe=t=>new Date(t).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),qe=t=>{const r=Z(t),s=r.icon;return e.jsxs(Me,{className:`${r.color} border-0`,children:[e.jsx(s,{className:"w-3 h-3 mr-1"}),r.label]})};return e.jsxs(Je,{breadcrumbs:[{title:"Calendar",href:"/appointments"}],children:[e.jsx(Xe,{title:"Appointments Calendar"}),e.jsx("style",{dangerouslySetInnerHTML:{__html:nt}}),e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50",children:[e.jsx("div",{className:"sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm",children:e.jsx("div",{className:" mx-auto px-6 py-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg",children:e.jsx(x,{className:"w-8 h-8 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",children:v||u?"My Schedule":"Calendar Management"}),e.jsx("p",{className:"text-sm text-slate-600 font-medium",children:v||u?`${_.user.name}'s appointments and tasks`:"Comprehensive appointment scheduling system"})]})]}),e.jsx("div",{className:"hidden lg:flex items-center gap-2",children:Object.entries(V).map(([t,r])=>{const s=r.icon;return e.jsxs("div",{className:"flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm hover:shadow-md transition-all duration-200",children:[e.jsx("div",{className:"w-2 h-2 rounded-full",style:{backgroundColor:r.bgColor}}),e.jsx(s,{className:"w-3.5 h-3.5 text-slate-600"}),e.jsx("span",{className:"text-xs font-medium text-slate-700",children:r.label})]},t)})})]})})}),P.length>0&&e.jsx("div",{className:" mx-auto px-6 pt-6",children:e.jsx("div",{className:"bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm",children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"p-2 bg-amber-100 rounded-xl",children:e.jsx(x,{className:"w-5 h-5 text-amber-600"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-sm font-semibold text-amber-900 mb-2",children:"Upcoming Appointments"}),e.jsx("div",{className:"space-y-1",children:P.map((t,r)=>e.jsx("p",{className:"text-sm text-amber-800",children:t},r))})]}),e.jsx(b,{variant:"ghost",size:"sm",onClick:()=>q([]),className:"p-2 h-8 w-8 rounded-full hover:bg-amber-100 text-amber-600 hover:text-amber-800",children:"×"})]})})}),e.jsx("div",{className:" mx-auto px-6 py-6",children:e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-12 gap-6",children:[e.jsx("div",{className:"xl:col-span-9",children:e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-white to-slate-50 border-b border-slate-100 p-6",children:e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-1",children:[e.jsx(b,{variant:"ghost",size:"sm",onClick:()=>H("prev"),className:"h-10 w-10 rounded-xl hover:bg-slate-100",children:e.jsx(at,{className:"w-4 h-4"})}),e.jsx(b,{variant:"ghost",size:"sm",onClick:()=>H("today"),className:"px-6 h-10 rounded-xl font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors",children:"Today"}),e.jsx(b,{variant:"ghost",size:"sm",onClick:()=>H("next"),className:"h-10 w-10 rounded-xl hover:bg-slate-100",children:e.jsx(st,{className:"w-4 h-4"})})]}),e.jsx("div",{className:"px-4",children:e.jsx("h2",{className:"text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",children:Ve()})})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 rounded-2xl p-1",children:[{view:d.DAY,label:"Day",icon:x},{view:d.WEEK,label:"Week",icon:x},{view:d.MONTH,label:"Month",icon:x},{view:d.AGENDA,label:"Agenda",icon:x}].map(({view:t,label:r,icon:s})=>e.jsxs(b,{variant:m===t?"default":"ghost",size:"sm",onClick:()=>G(t),className:`h-10 px-6 rounded-xl font-medium transition-all duration-200 ${m===t?"bg-white shadow-sm text-slate-900 hover:bg-white":"hover:bg-white/60 text-slate-600 hover:text-slate-900"}`,children:[e.jsx(s,{className:"w-4 h-4 mr-2"}),r]},t))})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"h-[700px] bg-white rounded-2xl shadow-inner border border-slate-100 overflow-hidden",children:e.jsx(Ze,{localizer:ot,events:Re,startAccessor:"start",endAccessor:"end",view:m,onView:G,date:S,onNavigate:L,onSelectEvent:Ue,onSelectSlot:Oe,selectable:!0,eventPropGetter:Ge,components:{event:Le,toolbar:()=>null},style:{height:"100%"},formats:{timeGutterFormat:"HH:mm",eventTimeRangeFormat:({start:t,end:r})=>`${g(t).format("HH:mm")} - ${g(r).format("HH:mm")}`,dayFormat:"ddd DD/MM",dateFormat:"DD",dayHeaderFormat:"dddd DD/MM/YYYY",dayRangeHeaderFormat:({start:t,end:r})=>`${g(t).format("DD/MM")} - ${g(r).format("DD/MM/YYYY")}`,agendaDateFormat:"dddd DD/MM/YYYY",agendaTimeFormat:"HH:mm",agendaTimeRangeFormat:({start:t,end:r})=>`${g(t).format("HH:mm")} - ${g(r).format("HH:mm")}`},min:new Date(2025,0,1,0,0,0),max:new Date(2025,0,1,23,59,59),step:60,timeslots:1,views:{day:!0,week:!0,month:!0,agenda:!0},showMultiDayTimes:!0,popup:!0,popupOffset:30,scrollToTime:new Date(1970,1,1,6,0,0)})})})]})}),e.jsxs("div",{className:"xl:col-span-3 space-y-6",children:[e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:" bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-xl",children:e.jsx(Ae,{className:"w-5 h-5 text-blue-600"})}),e.jsx("h3",{className:"text-lg font-bold text-blue-900",children:"Upcoming"})]})}),e.jsx("div",{className:"p-6",children:te.length===0?e.jsxs("div",{className:"text-center py-8",children:[e.jsx("div",{className:"p-4 bg-slate-50 rounded-2xl mx-auto w-fit mb-4",children:e.jsx(x,{className:"w-8 h-8 text-slate-400"})}),e.jsx("p",{className:"text-slate-500 font-medium",children:"No upcoming appointments"})]}):e.jsx("div",{className:"space-y-3",children:te.slice(0,4).map(t=>e.jsxs("div",{className:"group relative bg-gradient-to-r from-slate-50 to-white rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer",onClick:()=>Q(t),children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:"flex items-start justify-between mb-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx("h4",{className:"font-semibold text-slate-900 mb-1 group-hover:text-blue-900 transition-colors",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 font-medium",children:t.ticket.user.name})]}),e.jsx("div",{className:"flex items-center gap-2",children:(v||u)&&t.status==="scheduled"&&e.jsxs(b,{size:"sm",onClick:r=>{r.stopPropagation(),ee("start",t.id)},className:"h-8 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium shadow-sm",children:[e.jsx(Y,{className:"w-3 h-3 mr-1"}),"Start"]})})]}),e.jsxs("div",{className:"flex items-center gap-4 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-1 text-slate-500",children:[e.jsx(Ae,{className:"w-3 h-3"}),T(t.scheduled_for)]}),e.jsxs("div",{className:"flex items-center gap-1 text-slate-500",children:[e.jsx(y,{className:"w-3 h-3"}),t.technical.name]})]})]})]},t.id))})})]}),e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-emerald-100 rounded-xl",children:e.jsx(Ee,{className:"w-5 h-5 text-emerald-600"})}),e.jsx("h3",{className:"text-lg font-bold text-emerald-900",children:"Statistics"})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"space-y-4",children:[{label:"Total",count:p.length,color:"text-slate-600"},{label:"Scheduled",count:p.filter(t=>t.status==="scheduled").length,color:"text-blue-600"},{label:"In Progress",count:p.filter(t=>t.status==="in_progress").length,color:"text-yellow-600"},{label:"Completed",count:p.filter(t=>t.status==="completed").length,color:"text-green-600"},{label:"No Show",count:p.filter(t=>t.status==="no_show").length,color:"text-orange-600"},{label:"Cancelled",count:p.filter(t=>t.status==="cancelled").length,color:"text-red-600"}].map(t=>e.jsxs("div",{className:"flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100",children:[e.jsxs("span",{className:"text-sm font-medium text-slate-700",children:[t.label,":"]}),e.jsx("span",{className:`text-lg font-bold ${t.color}`,children:t.count})]},t.label))})})]}),e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-purple-50 to-violet-50 p-6 border-b border-purple-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-purple-100 rounded-xl",children:e.jsx(y,{className:"w-5 h-5 text-purple-600"})}),e.jsx("h3",{className:"text-lg font-bold text-purple-900",children:"Team"})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"space-y-3",children:$e.map(t=>e.jsxs("div",{className:"flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200",children:[e.jsx("div",{className:"w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm",children:t.name.charAt(0).toUpperCase()}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"font-semibold text-slate-900 text-sm",children:t.name}),e.jsx("p",{className:"text-xs text-slate-500",children:t.email})]}),e.jsx(Me,{variant:"outline",className:"text-xs bg-green-50 text-green-700 border-green-200 px-2 py-1 rounded-lg",children:"Available"})]},t.id))})})]})]})]})}),e.jsx(I,{open:l.open,onOpenChange:t=>w({open:t,appointment:l.appointment}),children:e.jsxs(R,{className:"sm:max-w-4xl max-h-[95vh] overflow-y-auto",children:[e.jsx(U,{className:"pb-6 border-b border-slate-200",children:e.jsxs(O,{className:"flex items-center gap-3 text-2xl font-bold",children:[e.jsx("div",{className:"p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg",children:e.jsx(x,{className:"w-7 h-7 text-white"})}),e.jsxs("div",{children:[e.jsx("div",{children:"Appointment Details"}),e.jsx("div",{className:"text-sm font-normal text-slate-600 mt-1",children:"Manage and track appointment progress"})]})]})}),e.jsx("div",{className:"max-h-[70vh] overflow-y-auto pr-2",children:l.appointment&&e.jsxs("div",{className:"space-y-8",children:[e.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm",children:[e.jsx("div",{className:"flex items-start justify-between mb-6",children:e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-xl font-bold text-slate-900 mb-2",children:l.appointment.title}),e.jsx("div",{className:"flex items-center gap-2",children:qe(l.appointment.status)})]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-lg",children:e.jsx(x,{className:"w-5 h-5 text-blue-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Scheduled Date & Time"}),e.jsx("div",{className:"text-base font-semibold text-slate-900",children:Pe(l.appointment.scheduled_for)}),e.jsx("div",{className:"text-sm text-slate-600",children:T(l.appointment.scheduled_for)})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-green-100 rounded-lg",children:e.jsx($,{className:"w-5 h-5 text-green-600"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Location"}),e.jsx("div",{className:"text-base font-semibold text-slate-900",children:(()=>{var a,o,i,h,f,k,D,ce,me,be,pe,xe,he,fe,ge,ue,ve,we,je,Ne,ye,ke,De,Ce,Se;const t=l.appointment;console.log("DEBUG - Full appointment object:",t),console.log("DEBUG - Ticket object:",t==null?void 0:t.ticket),console.log("DEBUG - Device object:",(a=t==null?void 0:t.ticket)==null?void 0:a.device),console.log("DEBUG - Device tenants:",(i=(o=t==null?void 0:t.ticket)==null?void 0:o.device)==null?void 0:i.tenants),console.log("DEBUG - User tenant:",(f=(h=t==null?void 0:t.ticket)==null?void 0:h.user)==null?void 0:f.tenant);const r=((pe=(be=(me=(ce=(D=(k=t==null?void 0:t.ticket)==null?void 0:k.device)==null?void 0:D.tenants)==null?void 0:ce[0])==null?void 0:me.apartment)==null?void 0:be.building)==null?void 0:pe.name)||((ue=(ge=(fe=(he=(xe=t==null?void 0:t.ticket)==null?void 0:xe.user)==null?void 0:he.tenant)==null?void 0:fe.apartment)==null?void 0:ge.building)==null?void 0:ue.name)||"Building not specified",s=((ye=(Ne=(je=(we=(ve=t==null?void 0:t.ticket)==null?void 0:ve.device)==null?void 0:we.tenants)==null?void 0:je[0])==null?void 0:Ne.apartment)==null?void 0:ye.name)||((Se=(Ce=(De=(ke=t==null?void 0:t.ticket)==null?void 0:ke.user)==null?void 0:De.tenant)==null?void 0:Ce.apartment)==null?void 0:Se.name);let n=r;return s&&(n+=` - ${s}`),n})()}),l.appointment.address&&e.jsx("div",{className:"text-sm text-slate-600 mt-1",children:l.appointment.address})]}),(()=>{var s,n,a,o,i,h,f,k,D;const t=l.appointment,r=((i=(o=(a=(n=(s=t==null?void 0:t.ticket)==null?void 0:s.device)==null?void 0:n.tenants)==null?void 0:a[0])==null?void 0:o.apartment)==null?void 0:i.building)||((D=(k=(f=(h=t==null?void 0:t.ticket)==null?void 0:h.user)==null?void 0:f.tenant)==null?void 0:k.apartment)==null?void 0:D.building);return r!=null&&r.location_link?e.jsx(b,{variant:"ghost",size:"sm",onClick:()=>X({open:!0,building:r}),className:"ml-2 p-2 h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200",title:"View on Map",children:e.jsx($,{className:"w-4 h-4 text-red-600"})}):null})()]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-purple-100 rounded-lg",children:e.jsx(y,{className:"w-5 h-5 text-purple-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Assigned Technician"}),e.jsx("div",{className:"text-base font-semibold text-slate-900",children:((ne=l.appointment.technical)==null?void 0:ne.name)||"Not assigned"})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-orange-100 rounded-lg",children:e.jsx(x,{className:"w-5 h-5 text-orange-600"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-slate-600",children:"Related Ticket"}),e.jsxs("div",{className:"text-base font-semibold text-slate-900",children:["#",((le=l.appointment.ticket)==null?void 0:le.code)||"N/A"]})]})]})]})]}),l.appointment.description&&e.jsxs("div",{className:"mt-6 p-4 bg-white rounded-xl border border-slate-100",children:[e.jsx("h4",{className:"text-sm font-medium text-slate-600 mb-2",children:"Description"}),e.jsx("p",{className:"text-slate-900",children:l.appointment.description})]}),l.appointment.member_instructions&&e.jsxs("div",{className:"mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100",children:[e.jsx("h4",{className:"text-sm font-medium text-blue-600 mb-2",children:"Instructions"}),e.jsx("p",{className:"text-blue-700",children:l.appointment.member_instructions})]}),l.appointment.completion_notes&&e.jsxs("div",{className:"mt-6 p-4 bg-green-50 rounded-xl border border-green-100",children:[e.jsx("h4",{className:"text-sm font-medium text-green-600 mb-2",children:"Completion Notes"}),e.jsx("p",{className:"text-green-700",children:l.appointment.completion_notes})]})]}),(v||u||_e)&&l.appointment.status==="scheduled"&&e.jsxs("div",{className:"bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-6",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-lg",children:e.jsx(Y,{className:"w-6 h-6 text-blue-600"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-bold text-blue-900",children:"Visit Actions"}),e.jsx("p",{className:"text-sm text-blue-700",children:"Start your visit or mark as no show"})]})]}),e.jsxs("div",{className:"flex gap-4",children:[e.jsxs(b,{onClick:()=>{ee("start",l.appointment.id),w({open:!1})},className:"flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold",children:[e.jsx(Y,{className:"w-5 h-5 mr-2"}),"Start Visit"]}),e.jsxs(b,{variant:"outline",onClick:()=>{A({open:!0,appointment:l.appointment}),w({open:!1})},className:"flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 py-3 px-6 rounded-xl font-semibold",children:[e.jsx(y,{className:"w-5 h-5 mr-2"}),"Mark as No Show"]})]})]})]})}),e.jsx(Qe,{className:"pt-6 border-t border-slate-200",children:e.jsxs("div",{className:"flex gap-3 w-full",children:[e.jsx(b,{variant:"outline",onClick:()=>{var t,r;return window.location.href=`/tickets?ticket=${(r=(t=l.appointment)==null?void 0:t.ticket)==null?void 0:r.id}`},className:"flex-1",children:"View Ticket"}),e.jsx(b,{onClick:()=>w({open:!1}),className:"flex-1",children:"Close"})]})})]})}),e.jsx(I,{open:M.open,onOpenChange:t=>X({open:t}),children:e.jsxs(R,{className:"sm:max-w-[800px]",children:[e.jsx(U,{children:e.jsxs(O,{className:"flex items-center gap-2",children:[e.jsx($,{className:"w-5 h-5 text-red-600"}),((ie=M.building)==null?void 0:ie.name)||"Building Location"]})}),e.jsx("div",{className:"w-full aspect-video",children:e.jsx("iframe",{src:(de=M.building)!=null&&de.location_link?He(M.building.location_link):"",width:"100%",height:"100%",style:{border:0},allowFullScreen:!0,loading:"lazy",referrerPolicy:"no-referrer-when-downgrade",title:"Building Location"})})]})}),e.jsx(I,{open:F.open,onOpenChange:t=>A({open:t}),children:e.jsxs(R,{className:"sm:max-w-md",children:[e.jsx(U,{children:e.jsxs(O,{className:"flex items-center gap-2",children:[e.jsx(y,{className:"w-5 h-5 text-orange-600"}),"Mark as No Show"]})}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Reason for No Show *"}),e.jsxs("select",{value:j.reason,onChange:t=>E({...j,reason:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500",required:!0,children:[e.jsx("option",{value:"",children:"Select a reason"}),ze.map(t=>e.jsx("option",{value:t.value,children:t.label},t.value))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Additional Description (Optional)"}),e.jsx("textarea",{value:j.description,onChange:t=>E({...j,description:t.target.value}),placeholder:"Enter additional details about the no-show...",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500",rows:3})]})]}),e.jsxs("div",{className:"flex gap-3 mt-6",children:[e.jsx(b,{variant:"outline",onClick:()=>{A({open:!1}),E({reason:"",description:"",notifyMember:!0,rescheduleOffered:!1})},className:"flex-1",disabled:z,children:"Cancel"}),e.jsx(b,{onClick:We,disabled:!j.reason||z,className:"flex-1 bg-orange-600 hover:bg-orange-700 text-white",children:z?"Processing...":"Mark as No Show"})]})]})})]})]})}export{Ht as default};
