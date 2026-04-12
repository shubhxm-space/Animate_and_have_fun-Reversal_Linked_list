// js/game.js

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.nodeCount = 3;
        this.nodeElements = [];
        this.arrowElements = [];
        
        this.ptrPrev = this.createPointer('prev', 'ptr-prev');
        this.ptrCurr = this.createPointer('curr', 'ptr-curr');
        this.ptrNext = this.createPointer('next', 'ptr-next');
        
        this.initDOM();
        
        this.expectedStepsSequence = [1, 2, 3, 4];
        this.currentStepIdx = 0;
        this.loopItemsProcessed = 0;
        
        // State
        this.prev = null;
        this.curr = 0;
        this.next = null;
        this.links = {0: 1, 1: 2, 2: 3}; // 3 is null
        
        this.score = 0;
        
        this.scoreEl = document.getElementById('game-score');
        this.msgEl = document.getElementById('game-message');
        this.hintEl = document.getElementById('game-hint');
        
        this.renderState();
    }

    createPointer(label, className) {
        const el = document.createElement('div');
        el.className = `v-pointer ${className}`;
        el.innerText = label;
        this.canvas.appendChild(el);
        return el;
    }

    initDOM() {
        Array.from(this.canvas.children).forEach(child => {
            if (!child.classList.contains('v-pointer')) {
                this.canvas.removeChild(child);
            }
        });

        const startX = 30;
        const gap = 100;
        for (let i = 0; i < this.nodeCount; i++) {
            const node = document.createElement('div');
            node.className = 'v-node';
            node.innerText = i + 1;
            node.style.left = `${startX + i * gap}px`;
            // scale smaller for game
            node.style.transform = 'scale(0.8)';
            this.canvas.appendChild(node);
            this.nodeElements.push({ el: node, x: startX + i * gap });
        }

        const nullNode = document.createElement('div');
        nullNode.className = 'v-node is-null';
        nullNode.innerText = 'null';
        nullNode.style.left = `${startX + this.nodeCount * gap}px`;
        nullNode.style.transform = 'scale(0.8)';
        this.canvas.appendChild(nullNode);
        this.nodeElements.push({ el: nullNode, x: startX + this.nodeCount * gap });

        for (let i = 0; i < this.nodeCount; i++) {
            const arrow = document.createElement('div');
            arrow.className = 'v-arrow';
            this.canvas.appendChild(arrow);
            this.arrowElements.push(arrow);
        }
    }

    renderState() {
        // Pointers
        const updatePtr = (ptrEl, val) => {
            if (val === null) {
                ptrEl.style.opacity = '0';
                ptrEl.style.left = '-100px';
            } else {
                ptrEl.style.opacity = '1';
                ptrEl.style.left = `${this.nodeElements[val].x + 5}px`;
            }
        };
        updatePtr(this.ptrPrev, this.prev);
        updatePtr(this.ptrCurr, this.curr);
        updatePtr(this.ptrNext, this.next);

        // Arrows
        for (let i = 0; i < this.nodeCount; i++) {
            const arrow = this.arrowElements[i];
            const target = this.links[i];
            
            if (target === null || target === undefined) {
                arrow.style.opacity = '0';
                continue;
            }
            
            arrow.style.opacity = '1';
            
            const srcX = this.nodeElements[i].x;
            const targetX = this.nodeElements[target].x;
            
            if (targetX > srcX) {
                arrow.style.left = `${srcX + 50}px`;
                arrow.style.width = `${targetX - srcX - 60}px`;
                arrow.style.top = `90px`;
                arrow.classList.remove('reversed');
            } else {
                arrow.style.left = `${targetX + 50}px`;
                arrow.style.width = `${srcX - targetX - 50}px`;
                arrow.style.top = `70px`;
                arrow.classList.add('reversed');
            }
        }
    }

    handleGuess(stepId, btnEl) {
        if (this.curr === null || this.curr >= this.nodeCount) return; // game over
        
        const expectedStep = this.expectedStepsSequence[this.currentStepIdx];
        
        if (parseInt(stepId) === expectedStep) {
            // Correct
            this.hintEl.classList.add('hide');
            this.score += 10;
            this.scoreEl.innerText = `Score: ${this.score}`;
            this.msgEl.innerText = 'Correct! keep going.';
            this.msgEl.className = 'game-msg success';
            
            this.applyStateChange(expectedStep);
            this.renderState();
            
            this.currentStepIdx++;
            if (this.currentStepIdx >= 4) {
                this.currentStepIdx = 0;
                this.loopItemsProcessed++;
                
                if (this.curr === null || this.curr >= this.nodeCount) {
                    this.msgEl.innerText = '🎉 Success! You reversed the list.';
                    this.msgEl.className = 'game-msg success';
                    
                    // celebrate
                    confettiEffect(btnEl);
                }
            }
        } else {
            // Wrong
            this.score = Math.max(0, this.score - 5);
            this.scoreEl.innerText = `Score: ${this.score}`;
            this.msgEl.innerText = 'Oops! Wrong step.';
            this.msgEl.className = 'game-msg error';
            
            btnEl.classList.add('shake');
            setTimeout(() => btnEl.classList.remove('shake'), 400);
            
            this.showHint(expectedStep);
        }
    }

    applyStateChange(step) {
        if (step === 1) this.next = this.links[this.curr];
        if (step === 2) this.links[this.curr] = this.prev;
        if (step === 3) this.prev = this.curr;
        if (step === 4) this.curr = this.next;
    }

    showHint(expectedStep) {
        this.hintEl.classList.remove('hide');
        if (expectedStep === 1) this.hintEl.innerText = "Hint: If you change links first, you lose the rest of the list. Save 'next'!";
        if (expectedStep === 2) this.hintEl.innerText = "Hint: Now that the rest of the list is safe, point current backward to 'prev'.";
        if (expectedStep === 3) this.hintEl.innerText = "Hint: Step 'prev' forward so it sits on the node we just finished.";
        if (expectedStep === 4) this.hintEl.innerText = "Hint: Step 'curr' forward to the 'next' node we saved in step 1.";
    }

    reset() {
        this.prev = null;
        this.curr = 0;
        this.next = null;
        this.links = {0: 1, 1: 2, 2: 3}; // 3 = null
        this.score = 0;
        this.currentStepIdx = 0;
        this.loopItemsProcessed = 0;
        
        this.scoreEl.innerText = `Score: ${this.score}`;
        this.msgEl.innerText = 'Game Restarted. Go!';
        this.msgEl.className = 'game-msg';
        this.hintEl.classList.add('hide');
        
        this.renderState();
    }
}

function confettiEffect(el) {
    // A cute placeholder for confetti logic (maybe add simple DOM confetti dots)
    console.log("Win Confetti!");
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine('game-canvas');
    
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const step = e.target.closest('button').dataset.step;
            game.handleGuess(step, e.target.closest('button'));
        });
    });
    
    document.getElementById('game-reset').addEventListener('click', () => game.reset());
});
