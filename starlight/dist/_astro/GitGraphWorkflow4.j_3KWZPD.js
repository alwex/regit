import{j as a,G as c}from"./GitGraphWrapper.ki74H1Lv.js";import"./index.LFf77hJu.js";function s(){return a.jsx(c,{children:o=>{const t=o.branch({name:"stable"});t.commit("Initial Commit");const e=t.branch("feature-a");e.commit("commit1"),e.commit("commit1");const m=t.branch("feature-b");m.commit("commit1"),m.commit("commit1"),m.commit("commit1");const r=t.branch("release-1.1.0");r.merge(e),r.merge(m),t.merge(r)}})}export{s as default};