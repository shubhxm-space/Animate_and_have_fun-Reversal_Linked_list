// js/visualizer.js

class Visualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.nodeCount = 3;
        this.nodeElements = [];
        this.arrowElements = [];
        
        // Pointers
        this.ptrPrev = this.createPointer('prev', 'ptr-prev');
        this.ptrCurr = this.createPointer('curr', 'ptr-curr');
        this.ptrNext = this.createPointer('next', 'ptr-next');
        
        this.frames = [];
        this.currentFrameIdx = 0;
        this.playInterval = null;

        this.initDOM();
        this.generateFrames();
        this.renderFrame(0);
    }

    createPointer(label, className) {
        const el = document.createElement('div');
        el.className = `v-pointer ${className}`;
        el.innerText = label;
        this.canvas.appendChild(el);
        return el;
    }

    initDOM() {
        // Clear previous except pointers
        Array.from(this.canvas.children).forEach(child => {
            if (!child.classList.contains('v-pointer')) {
                this.canvas.removeChild(child);
            }
        });

        // Add nodes
        const startX = 50;
        const gap = 120;
        for (let i = 0; i < this.nodeCount; i++) {
            const node = document.createElement('div');
            node.className = 'v-node';
            node.innerText = i + 1;
            node.style.left = `${startX + i * gap}px`;
            this.canvas.appendChild(node);
            this.nodeElements.push({ el: node, x: startX + i * gap });
        }

        // Add Null Node
        const nullNode = document.createElement('div');
        nullNode.className = 'v-node is-null';
        nullNode.innerText = 'null';
        nullNode.style.left = `${startX + this.nodeCount * gap}px`;
        this.canvas.appendChild(nullNode);
        // Let's store it as node index `this.nodeCount`
        this.nodeElements.push({ el: nullNode, x: startX + this.nodeCount * gap });

        // Add arrows (we need one for each node that can point somewhere)
        // Since arrows move dynamically based on `links` map, we will create arrows on the fly or just create N arrows
        for (let i = 0; i < this.nodeCount; i++) {
            const arrow = document.createElement('div');
            arrow.className = 'v-arrow';
            this.canvas.appendChild(arrow);
            this.arrowElements.push(arrow);
        }
    }

    generateFrames() {
        this.frames = [];
        let prev = null;
        let curr = 0;
        let next = null;
        let links = {0: 1, 1: 2, 2: 3}; // 3 represents 'null'

        // Frame 0: Initial state
        this.frames.push({
            code: 0, prev: prev, curr: curr, next: next,
            links: {...links}
        });

        while (curr !== null && curr < this.nodeCount) {
             // 1. next = curr.next
             next = links[curr];
             this.frames.push({
                 code: 1, prev, curr, next, links: {...links}
             });

             // 2. curr.next = prev
             links[curr] = prev;
             this.frames.push({
                 code: 2, prev, curr, next, links: {...links}
             });

             // 3. prev = curr
             prev = curr;
             this.frames.push({
                 code: 3, prev, curr, next, links: {...links}
             });

             // 4. curr = next
             curr = next;
             this.frames.push({
                 code: 4, prev, curr, next, links: {...links}
             });
        }
    }

    updatePointers(frame) {
        const updatePtr = (ptrEl, val) => {
            if (val === null) {
                ptrEl.style.opacity = '0';
                ptrEl.style.left = '-100px';
            } else {
                ptrEl.style.opacity = '1';
                ptrEl.style.left = `${this.nodeElements[val].x + 10}px`; // center slightly
            }
        };
        updatePtr(this.ptrPrev, frame.prev);
        updatePtr(this.ptrCurr, frame.curr);
        updatePtr(this.ptrNext, frame.next);
    }

    updateArrows(frame) {
        // Go through each node, if its links[i] is not undefined/null, draw arrow
        for (let i = 0; i < this.nodeCount; i++) {
            const arrow = this.arrowElements[i];
            const target = frame.links[i];
            
            if (target === null || target === undefined) {
                arrow.style.opacity = '0';
                continue;
            }
            
            arrow.style.opacity = '1';
            
            // source is node i
            const srcX = this.nodeElements[i].x;
            const targetX = this.nodeElements[target].x;
            
            if (targetX > srcX) {
                // Pointing forward
                arrow.style.left = `${srcX + 60}px`;
                arrow.style.width = `${targetX - srcX - 65}px`;
                arrow.style.top = `125px`;
                arrow.classList.remove('reversed');
            } else {
                // Pointing backward
                arrow.style.left = `${targetX + 65}px`;
                arrow.style.width = `${srcX - targetX - 65}px`;
                // If it's pointing back, curve it or just move it top/bot so it doesn't overlap
                // Just moving it slightly higher visually
                arrow.style.top = `100px`;
                arrow.classList.add('reversed');
            }
        }
    }

    updateCode(frame) {
        [1, 2, 3, 4].forEach(row => {
            const el = document.getElementById(`code-line-${row}`);
            if(el) {
                if (frame.code === row) el.classList.add('active');
                else el.classList.remove('active');
            }
        });
    }

    renderFrame(idx) {
        const frame = this.frames[idx];
        this.updatePointers(frame);
        this.updateArrows(frame);
        this.updateCode(frame);
    }

    step() {
        if (this.currentFrameIdx < this.frames.length - 1) {
            this.currentFrameIdx++;
            this.renderFrame(this.currentFrameIdx);
        } else {
            this.stopAutoPlay();
        }
    }

    reset() {
        this.stopAutoPlay();
        this.currentFrameIdx = 0;
        this.renderFrame(this.currentFrameIdx);
    }

    play() {
        if (this.playInterval) {
            this.stopAutoPlay();
            return;
        }
        if (this.currentFrameIdx >= this.frames.length - 1) {
            this.reset();
        }
        document.getElementById('demo-play').innerText = '⏸ Pause';
        this.playInterval = setInterval(() => {
            this.step();
        }, 1000);
    }

    stopAutoPlay() {
        if (this.playInterval) clearInterval(this.playInterval);
        this.playInterval = null;
        document.getElementById('demo-play').innerText = '▶ Auto Play';
    }
}

// Init Demo Visualizer
window.addEventListener('DOMContentLoaded', () => {
    const demoVis = new Visualizer('demo-canvas');
    
    document.getElementById('demo-step').addEventListener('click', () => demoVis.step());
    document.getElementById('demo-reset').addEventListener('click', () => demoVis.reset());
    document.getElementById('demo-play').addEventListener('click', () => demoVis.play());
});
