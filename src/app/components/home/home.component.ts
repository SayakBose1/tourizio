import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { Router } from "@angular/router";
import { isPlatformBrowser } from "@angular/common";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  title = "Welcome to Tourizio, your ultimate tourism platform";

  // Typing text properties
  displaySubtitle = "";
  showCursor = true;
  private typingSpeed = 100; // milliseconds per character
  private eraseSpeed = 50; // milliseconds per character for erasing
  private pauseAfterTyping = 2000; // pause after typing completes
  private pauseAfterErasing = 1000; // pause before typing again

  private subtitle =
    "Plan your next adventure with ease. Explore destinations, book trips, and more!";

  // Scroll reveal properties
  private scrollRevealElements: NodeListOf<Element> | null = null;
  private scrollListener: (() => void) | null = null;
  private resizeListener: (() => void) | null = null;
  private animationFrame: number | null = null;
  private ticking = false;

  // Typing animation timers
  private typingTimer: any = null;
  private erasingTimer: any = null;
  private pauseTimer: any = null;

  carouselImages: string[] = [
    "assets/images/img1.jpg",
    "assets/images/img2.jpg",
    "assets/images/img3.jpeg",
    "assets/images/img4.jpg",
    "assets/images/img5.jpg",
    "assets/images/img6.jpg",
  ];

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startTypingLoop();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        this.initScrollReveal();
        this.addInteractionEffects();
      }, 100);
    }
  }

  ngOnDestroy() {
    // Clean up all timers and event listeners
    this.cleanupTypingAnimation();
    this.cleanupScrollReveal();
  }

  // ===== TYPING ANIMATION METHODS =====
  private startTypingLoop() {
    this.typeText(this.subtitle, () => {
      this.pauseTimer = setTimeout(() => {
        this.eraseText(() => {
          this.pauseTimer = setTimeout(() => {
            this.startTypingLoop(); // repeat indefinitely
          }, this.pauseAfterErasing);
        });
      }, this.pauseAfterTyping);
    });
  }

  private typeText(text: string, callback?: () => void) {
    let i = 0;
    this.displaySubtitle = "";
    this.typingTimer = setInterval(() => {
      this.displaySubtitle += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
        if (callback) callback();
      }
    }, this.typingSpeed);
  }

  private eraseText(callback?: () => void) {
    let i = this.displaySubtitle.length;
    this.erasingTimer = setInterval(() => {
      this.displaySubtitle = this.displaySubtitle.substring(0, i - 1);
      i--;
      if (i <= 0) {
        clearInterval(this.erasingTimer);
        this.erasingTimer = null;
        if (callback) callback();
      }
    }, this.eraseSpeed);
  }

  private cleanupTypingAnimation() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.erasingTimer) {
      clearInterval(this.erasingTimer);
      this.erasingTimer = null;
    }
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  // ===== SCROLL REVEAL METHODS =====
  private initScrollReveal() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scrollRevealElements =
      this.elementRef.nativeElement.querySelectorAll(".scroll-reveal");

    this.scrollListener = () => this.optimizedScrollReveal();
    this.resizeListener = () => this.optimizedScrollReveal();

    window.addEventListener("scroll", this.scrollListener, { passive: true });
    window.addEventListener("resize", this.resizeListener, { passive: true });

    // Initial check
    this.revealOnScroll();
  }

  private optimizedScrollReveal() {
    if (!this.ticking) {
      this.animationFrame = requestAnimationFrame(() => {
        this.revealOnScroll();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private revealOnScroll() {
    if (!this.scrollRevealElements || !isPlatformBrowser(this.platformId))
      return;

    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;

    this.scrollRevealElements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      const elementTop = htmlElement.offsetTop;
      const revealPoint = 100; // Adjust this value to control when animation triggers

      if (scrollTop + windowHeight - revealPoint > elementTop) {
        // Add delay based on transition-delay style if present
        const delay = htmlElement.style.transitionDelay || "0s";
        const delayMs = parseFloat(delay) * 1000;

        setTimeout(() => {
          htmlElement.classList.add("show");
        }, delayMs);
      }
    });
  }

  // ===== INTERACTION EFFECTS =====
  private addInteractionEffects() {
    if (!isPlatformBrowser(this.platformId)) return;

    const cards = this.elementRef.nativeElement.querySelectorAll(
      ".tourism-stat-card, .testimonial-card-hover"
    );

    cards.forEach((card: HTMLElement) => {
      // Add subtle scale on click for mobile devices
      const touchStartHandler = () => {
        card.style.transform = "scale(0.98)";
      };

      const touchEndHandler = () => {
        card.style.transform = "";
      };

      const focusHandler = () => {
        card.style.outline = "3px solid rgba(59, 130, 246, 0.5)";
        card.style.outlineOffset = "2px";
      };

      const blurHandler = () => {
        card.style.outline = "none";
      };

      card.addEventListener("touchstart", touchStartHandler, { passive: true });
      card.addEventListener("touchend", touchEndHandler, { passive: true });
      card.addEventListener("focus", focusHandler);
      card.addEventListener("blur", blurHandler);

      // Store references for cleanup
      (card as any).__tourizio_handlers = {
        touchStartHandler,
        touchEndHandler,
        focusHandler,
        blurHandler,
      };
    });
  }

  private cleanupScrollReveal() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Remove event listeners
    if (this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
      this.scrollListener = null;
    }

    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
      this.resizeListener = null;
    }

    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Clean up interaction effect handlers
    const cards = this.elementRef.nativeElement.querySelectorAll(
      ".tourism-stat-card, .testimonial-card-hover"
    );
    cards.forEach((card: HTMLElement) => {
      const handlers = (card as any).__tourizio_handlers;
      if (handlers) {
        card.removeEventListener("touchstart", handlers.touchStartHandler);
        card.removeEventListener("touchend", handlers.touchEndHandler);
        card.removeEventListener("focus", handlers.focusHandler);
        card.removeEventListener("blur", handlers.blurHandler);
        delete (card as any).__tourizio_handlers;
      }
    });
  }

  // ===== NAVIGATION METHODS =====
  goToDestinations() {
    this.router.navigate(["/destinations"]);
  }

  // ===== UTILITY METHODS =====

  /**
   * Method to manually trigger scroll reveal for dynamically added content
   */
  refreshScrollReveal() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initScrollReveal();
      }, 100);
    }
  }

  /**
   * Method to pause/resume typing animation
   */
  pauseTypingAnimation() {
    this.cleanupTypingAnimation();
  }

  /**
   * Method to resume typing animation
   */
  resumeTypingAnimation() {
    if (isPlatformBrowser(this.platformId)) {
      this.startTypingLoop();
    }
  }
}
