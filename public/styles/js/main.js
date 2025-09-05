/***************************************************
==================== JS INDEX ======================
****************************************************
Preloader js
Data js
Sticky Nav Js
Mobile Menu Js
Search Bar Js
Rating Js
Nice Select Js
Client-slider Js
Marquee slider Js
Project Slider Js
Project hover Js
Testimonial Slider Js
Testimonial Slider 2 Js
Testimonial Slider 3 Js
Hero slider Js
Service Slider Js
Accordion Js
Backtotop Js
CounterUp js
VenoBox Js
Progressbar js
GSAP Registration

****************************************************/

(function ($) {
	"use strict";

	// Preloader js
	$(window).on("load", function () {
		const tjPreloader = $(".preloader");
		if (tjPreloader?.length) {
			setTimeout(function () {
				tjPreloader.removeClass("is-loading").addClass("is-loaded");
				setTimeout(function () {
					tjPreloader.fadeOut(600);
					wowController();
					gsapController();
					counterController();
				});
			}, 1000);
		} else {
			wowController();
			gsapController();
			counterController();
		}
	});

	////////////////////////////////////////////////////
	// Data js
	$("[data-bg-image]").each(function () {
		var $this = $(this),
			$image = $this.data("bg-image");
		$this.css("background-image", "url(" + $image + ")");
	});

	////////////////////////////////////////////////////
	// Sticky Nav Js
	var lastScrollTop = "";
	function stickyMenu($targetMenu, $toggleClass) {
		var st = $(window).scrollTop();
		if ($(window).scrollTop() > 500) {
			if (st > lastScrollTop) {
				$targetMenu.removeClass($toggleClass);
			} else {
				$targetMenu.addClass($toggleClass);
			}
		} else {
			$targetMenu.removeClass($toggleClass);
		}

		lastScrollTop = st;
	}

	$(window).on("scroll", function () {
		if ($(".header-area").length) {
			stickyMenu($(".header-sticky"), "sticky");
		}
	});

	////////////////////////////////////////////////////
	// Mobile Menu Js
	$(".mobile_menu_bar").on("click", function () {
		$(this).toggleClass("on");
	});

	// Mobile Menu Js
	$("#mobile-menu").meanmenu({
		meanMenuContainer: ".mobile_menu",
		meanScreenWidth: "991",
		meanExpand: ['<i class="tji-arrow-menu"></i>'],
	});

	// Hamburger Menu Js
	$(".mobile_menu_bar").on("click", function () {
		$(".hamburger-area").addClass("opened");
		$(".body-overlay").addClass("opened");
		$("body").toggleClass("overflow-hidden");
	});

	// Offcanvas js
	$(".menu_offcanvas").on("click", function () {
		$(".tj-offcanvas-area").toggleClass("opened");
		$(".body-overlay").addClass("opened");
		$("body").toggleClass("overflow-hidden");
	});
	$(".hamburger_close_btn").on("click", function () {
		$(".tj-offcanvas-area").removeClass("opened");
		$(".hamburger-area").removeClass("opened");
		$(".body-overlay").removeClass("opened");
		$("body").toggleClass("overflow-hidden");
	});
	$(".body-overlay").on("click", function () {
		$(".tj-offcanvas-area").removeClass("opened");
		$(".hamburger-area").removeClass("opened");
		$(".body-overlay").removeClass("opened");
		$("body").toggleClass("overflow-hidden");
	});

	////////////////////////////////////////////////////
	// Search Bar Js
	$(".header-search").on("click", function () {
		$(".search_popup").addClass("search-opened");
		$(".search-popup-overlay").addClass("opened");
	});
	$(".search_close_btn").on("click", function () {
		$(".search_popup").removeClass("search-opened");
		$(".search-popup-overlay").removeClass("opened");
	});
	$(".search-popup-overlay").on("click", function () {
		$(".search_popup").removeClass("search-opened");
		$(this).removeClass("opened");
	});

	////////////////////////////////////////////////////
	// Rating Js
	if ($(".fill-ratings span").length > 0) {
		var star_rating_width = $(".fill-ratings span").width();
		$(".star-ratings").width(star_rating_width);
	}

	////////////////////////////////////////////////////
	// Nice Select Js
	if ($("select").length > 0) {
		$("select").niceSelect();
	}

	////////////////////////////////////////////////////
	// Client-slider Js
	if ($(".client-slider").length > 0) {
		var client = new Swiper(".client-slider", {
			slidesPerView: "auto",
			spaceBetween: 0,
			freemode: true,
			centeredSlides: true,
			loop: true,
			speed: 5000,
			allowTouchMove: false,
			autoplay: {
				delay: 1,
				disableOnInteraction: true,
			},
		});
	}

	////////////////////////////////////////////////////
	// Marquee slider Js
	if ($(".marquee-slider").length > 0) {
		var marquee = new Swiper(".marquee-slider", {
			slidesPerView: "auto",
			spaceBetween: 0,
			freemode: true,
			centeredSlides: true,
			loop: true,
			speed: 7000,
			allowTouchMove: false,
			autoplay: {
				delay: 1,
				disableOnInteraction: true,
			},
		});
	}

	////////////////////////////////////////////////////
	// Project Slider Js
	if ($(".project-slider").length > 0) {
		var project = new Swiper(".project-slider", {
			slidesPerView: 1.15,
			spaceBetween: 15,
			loop: true,
			speed: 1500,
			arrow: false,
			autoplay: {
				delay: 3000,
			},
			pagination: {
				el: ".swiper-pagination-area",
				clickable: true,
			},
			breakpoints: {
				576: {
					slidesPerView: 1.25,
					spaceBetween: 20,
					centeredSlides: true,
				},
				992: {
					slidesPerView: 2,
					spaceBetween: 30,
					centeredSlides: false,
				},
			},
		});
	}

	// Project Slider 2 Js
	if ($(".project-slider-2").length > 0) {
		var project = new Swiper(".project-slider-2", {
			slidesPerView: 1,
			spaceBetween: 15,
			loop: true,
			speed: 1500,
			arrow: false,
			autoplay: {
				delay: 3000,
			},
			pagination: {
				el: ".swiper-pagination-area",
				clickable: true,
			},
			breakpoints: {
				600: {
					slidesPerView: 2,
					spaceBetween: 20,
				},
				992: {
					slidesPerView: 3,
					spaceBetween: 20,
				},
				1024: {
					slidesPerView: 3,
					spaceBetween: 30,
				},
			},
		});
	}

	// Project hover Js
	if ($(".hover-item").length > 0) {
		$(".hover-item").on("mouseover", function () {
			$(this).addClass("active").siblings().removeClass("active");
		});
	}

	////////////////////////////////////////////////////
	// Testimonial Slider Js
	if ($(".testimonial-slider").length > 0) {
		var testimonial = new Swiper(".testimonial-slider", {
			slidesPerView: 1,
			spaceBetween: 28,
			loop: true,
			speed: 1500,
			autoplay: {
				delay: 5000,
			},
			navigation: {
				nextEl: ".slider-next",
				prevEl: ".slider-prev",
			},
			pagination: {
				el: ".swiper-pagination-area",
				clickable: true,
			},
		});
	}

	// Testimonial Slider 2 Js
	if ($(".testimonial-slider-2").length > 0) {
		var testimonial = new Swiper(".testimonial-slider-2", {
			slidesPerView: 3,
			spaceBetween: 28,
			centeredSlides: true,
			loop: true,
			speed: 1500,
			autoplay: {
				delay: 3000,
			},
			navigation: {
				nextEl: ".slider-next",
				prevEl: ".slider-prev",
			},
			pagination: {
				el: ".swiper-pagination-area",
				clickable: true,
			},
			breakpoints: {
				0: {
					slidesPerView: 1.15,
					spaceBetween: 15,
					centeredSlides: false,
				},
				576: {
					slidesPerView: 1.3,
					spaceBetween: 20,
					centeredSlides: false,
				},
				768: {
					slidesPerView: 2,
					spaceBetween: 20,
					centeredSlides: false,
				},
				992: {
					slidesPerView: 3,
					spaceBetween: 20,
				},
				1200: {
					slidesPerView: 3,
				},
			},
		});
	}

	// Testimonial Slider 3 Js
	if ($(".testimonial-slider-3").length > 0) {
		var testimonial = new Swiper(".testimonial-slider-3", {
			slidesPerView: 3,
			centeredSlides: true,
			loop: true,
			speed: 1500,
			// autoplay: {
			// 	delay: 3000,
			// },
			navigation: {
				nextEl: ".slider-next",
				prevEl: ".slider-prev",
			},
			pagination: {
				el: ".swiper-pagination-area",
				clickable: true,
			},
			breakpoints: {
				0: {
					slidesPerView: 1,
					spaceBetween: 15,
					centeredSlides: false,
				},
				576: {
					slidesPerView: 1.3,
					spaceBetween: 15,
				},
				768: {
					slidesPerView: 1.7,
					spaceBetween: 20,
				},
				992: {
					slidesPerView: 2.5,
					spaceBetween: 20,
				},
				1200: {
					slidesPerView: 2.7,
					spaceBetween: 28,
				},
			},
		});
	}

	////////////////////////////////////////////////////
	// Team Slider Js
	if ($(".team-slider").length > 0) {
		var team = new Swiper(".team-slider", {
			slidesPerView: 4,
			spaceBetween: 28,
			centeredSlides: false,
			loop: true,
			speed: 800,
			autoplay: {
				delay: 3000,
			},
			navigation: {
				nextEl: ".slider-next",
				prevEl: ".slider-prev",
			},
			pagination: {
				el: ".swiper-pagination-area",
				clickable: true,
			},
			breakpoints: {
				0: {
					slidesPerView: 1.15,
					spaceBetween: 15,
				},
				576: {
					slidesPerView: 2,
					spaceBetween: 20,
				},
				768: {
					slidesPerView: 2,
					spaceBetween: 20,
				},
				992: {
					slidesPerView: 3,
					spaceBetween: 20,
				},
				1200: {
					slidesPerView: 4,
				},
			},
		});
	}
	////////////////////////////////////////////////////
	// Hero slider Js
	if ($(".hero-slider").length > 0) {
		var hero = new Swiper(".hero-slider", {
			slidesPerView: 1,
			spaceBetween: 0,
			effect: "fade",
			loop: true,
			speed: 1400,
			autoplay: {
				delay: 4000,
			},
			navigation: {
				nextEl: ".slider-next",
				prevEl: ".slider-prev",
			},
			pagination: {
				el: ".hero-pagination",
				clickable: true,
				renderBullet: function (index, className) {
					return (
						'<span class="' + className + '">' + "0" + (index + 1) + "</span>"
					);
				},
			},
		});
	}

	////////////////////////////////////////////////////
	// Price box Js
	let year = $(".yearly");
	let month = $(".monthly");

	let price = $(".price-number");
	let period = $(".package-period");

	year.on("click", function () {
		$(this).addClass("active");
		month.removeClass("active");
		price.each(function () {
			$(this).text($(this).data("year-price"));
		});
		period.each(function () {
			$(this).text($(this).data("year-period"));
		});
	});
	month.on("click", function () {
		$(this).addClass("active");
		year.removeClass("active");
		price.each(function () {
			$(this).text($(this).data("month-price"));
		});
		period.each(function () {
			$(this).text($(this).data("month-period"));
		});
	});

	// tj-tab-switcher Js
	$(".tj-tab-switcher__controller").on("change", function () {
		if ($(this).prop("checked")) {
			$("#tab1").removeClass("show active");
			$("#tab2").addClass("show active");
		} else {
			$("#tab2").removeClass("show active");
			$("#tab1").addClass("show active");
		}
	});

	////////////////////////////////////////////////////
	// Service Slider Js
	if ($(".service-slider").length > 0) {
		var service = new Swiper(".service-slider", {
			slidesPerView: 3,
			spaceBetween: 28,
			centeredSlides: false,
			loop: true,
			speed: 1500,
			autoplay: {
				delay: 2000,
			},
			navigation: {
				nextEl: ".slider-next",
				prevEl: ".slider-prev",
			},
			pagination: {
				el: ".swiper-pagination-area",
				clickable: true,
			},
			breakpoints: {
				0: {
					slidesPerView: 1.15,
					spaceBetween: 15,
				},
				420: {
					slidesPerView: 1.4,
					spaceBetween: 15,
				},
				576: {
					slidesPerView: 2,
					spaceBetween: 15,
				},
				992: {
					slidesPerView: 2,
					spaceBetween: 20,
				},
				1200: {
					slidesPerView: 3,
				},
			},
		});
	}

	////////////////////////////////////////////////////
	// Home 8 testimonial
	const testimonialsMarqueeSliders = {};

	function testimonialsMarquee(selector, isReverse = false, speed = 8000) {
		// const screenWidth = window.innerWidth;
		// const direction = screenWidth >= 768 ? "vertical" : "horizontal";

		// Destroy previous instance if exists
		// if (testimonialsMarqueeSliders[selector]) {
		// 	testimonialsMarqueeSliders[selector].destroy(true, true);
		// }

		// Init if element exists
		if ($(selector).length > 0) {
			testimonialsMarqueeSliders[selector] = new Swiper(selector, {
				slidesPerView: "auto",
				spaceBetween: 15,
				centeredSlides: true,
				loop: true,
				allowTouchMove: false,
				speed: speed,
				direction: "vertical",
				autoplay: {
					delay: 0,
					disableOnInteraction: false,
					reverseDirection: isReverse,
				},
				breakpoints: {
					768: {
						spaceBetween: 18,
					},
				},
			});
		}
	}

	// Initialize both sliders
	testimonialsMarquee(".h4-hero-slider-up");
	testimonialsMarquee(".h4-hero-slider-down", true);

	// Reinitialize on resize
	// window.addEventListener("resize", () => {
	// 	testimonialsMarquee(".h4-hero-slider-up");
	// 	testimonialsMarquee(".h4-hero-slider-down", true);
	// });

	////////////////////////////////////////////////////
	// Accordion Js
	if ($(".accordion-item").length > 0) {
		$(".accordion-item button").on("click", function () {
			if ($(this).parent().hasClass("active")) {
				$(this).parent().removeClass("active");
			} else {
				$(this).parent().siblings().removeClass("active");
				$(this).parent().addClass("active");
			}
		});
	}

	////////////////////////////////////////////////////
	// Gallery-slider Js
	if ($(".gallery-slider").length > 0) {
		var gallery = new Swiper(".gallery-slider", {
			slidesPerView: "auto",
			spaceBetween: 0,
			freemode: true,
			centeredSlides: true,
			loop: true,
			speed: 5000,
			allowTouchMove: false,
			autoplay: {
				delay: 1,
				disableOnInteraction: true,
			},
		});
	}

	////////////////////////////////////////////////////
	// Backtotop Js
	function back_to_top() {
		var btn = $("#back_to_top");
		var btn_wrapper = $(".back-to-top-wrapper");

		$(window).on("scroll", function () {
			if ($(window).scrollTop() > 300) {
				btn_wrapper.addClass("back-to-top-btn-show");
			} else {
				btn_wrapper.removeClass("back-to-top-btn-show");
			}
		});

		btn.on("click", function (e) {
			e.preventDefault();
			$("html, body").animate({ scrollTop: 0 }, "300");
		});
	}
	back_to_top();

	////////////////////////////////////////////////////
	// CounterUp js
	function counterController() {
		if (jQuery(".counter").length > 0) {
			$(".counter").counterUp({
				delay: 10,
				time: 1000,
			});
		}
	}

	////////////////////////////////////////////////////
	// wow js
	function wowController() {
		if ($(".wow").length > 0) {
			new WOW().init();
		}
	}

	////////////////////////////////////////////////////
	// VenoBox Js
	if ($(".gallery").length > 0) {
		new VenoBox({
			selector: ".gallery",
			numeration: true,
			// infinigall: true,
			spinner: "pulse",
		});
	}

	if ($(".video-popup").length > 0) {
		new VenoBox({
			selector: ".video-popup",
			numeration: true,
			// infinigall: true,
			spinner: "pulse",
		});
	}

	////////////////////////////////////////////////////
	// progress bar
	const progressBarController = () => {
		const progressContainers = document.querySelectorAll(".tj-progress");

		if (progressContainers?.length) {
			progressContainers.forEach(progressContainer => {
				const targetedProgressBar =
					progressContainer.querySelector(".tj-progress-bar");
				const completedPercent =
					parseInt(targetedProgressBar.getAttribute("data-percent", 10)) || 0;

				// Trigger animation when the element comes into view
				const observer = new IntersectionObserver(
					entries => {
						entries.forEach(entry => {
							if (entry.isIntersecting) {
								// Animate the progress bar
								targetedProgressBar.style.transition = "width 2s ease-out";
								targetedProgressBar.style.width = `${completedPercent}%`;

								// Animate the percentage text
								const percentageText = progressContainer.querySelector(
									".tj-progress-percent"
								);
								if (percentageText) {
									let currentPercent = 0;

									const interval = setInterval(() => {
										currentPercent++;
										percentageText.textContent = `${currentPercent}%`;

										if (currentPercent >= completedPercent) {
											clearInterval(interval); // Stop the animation
										}
									}, 15); // Adjust the interval for animation speed
								}
							}
						});
					},
					{
						root: null, // Observing the viewport
						threshold: [0.3, 0.9], // Progress triggers based on visibility
					}
				);
				observer.observe(progressContainer);
			});
		}
	};

	// Call the function
	progressBarController();

	/* ------------- GSAP Registration -------------*/

	gsap.registerPlugin(ScrollTrigger, TweenMax, ScrollToPlugin);

	gsap.config({
		nullTargetWarn: false,
	});
	function gsapController() {
		/* ------------- Positon Sticky Js -------------*/
		let mediaMatch = gsap.matchMedia();

		/* Text Effect Animation */
		if ($(".text-anim").length) {
			let staggerAmount = 0.02,
				translateXValue = 20,
				delayValue = 0.3,
				easeType = "power2.out",
				animatedTextElements = document.querySelectorAll(".text-anim");

			animatedTextElements.forEach(element => {
				let animationSplitText = new SplitText(element, {
					type: "chars, words",
				});
				gsap.from(animationSplitText.chars, {
					duration: 1,
					delay: delayValue,
					x: translateXValue,
					autoAlpha: 0,
					stagger: staggerAmount,
					ease: easeType,
					scrollTrigger: { trigger: element, start: "top 85%" },
				});
			});
		}

		/* Title Animation */
		if ($(".title-anim").length) {
			let staggerAmount = 0.01,
				delayValue = 0.1,
				easeType = "power1.inout",
				animatedTitleElements = document.querySelectorAll(".title-anim");

			animatedTitleElements.forEach(element => {
				let animatedTitleElements = new SplitText(element, {
					types: "lines, words",
				});
				gsap.from(animatedTitleElements.chars, {
					y: "100%",
					duration: 0.5,
					delay: delayValue,
					autoAlpha: 0,
					stagger: staggerAmount,
					ease: easeType,
					scrollTrigger: { trigger: element, start: "top 85%" },
				});
			});
		}

		/* Service js */
		let device_width = window.innerWidth;
		const serviceStack = gsap.utils.toArray(".service-stack");
		if (serviceStack.length > 0) {
			if (device_width > 767) {
				serviceStack.forEach(item => {
					gsap.to(item, {
						opacity: 0,
						scale: 0.9,
						y: 50,
						scrollTrigger: {
							trigger: item,
							scrub: true,
							start: "top 90px",
							pin: true,
							pinSpacing: false,
							markers: false,
						},
					});
				});
			}
		}

		// right swipe
		document.querySelectorAll(".rightSwipeWrap").forEach((wrap, i) => {
			gsap.set(wrap.querySelectorAll(".right-swipe"), {
				transformPerspective: 1200,
				x: "10rem",
				rotateY: -20,
				opacity: 0,
				transformOrigin: "right center",
			});
			gsap.to(wrap.querySelectorAll(".right-swipe"), {
				transformPerspective: 1200,
				x: 0,
				rotateY: 0,
				opacity: 1,
				delay: 0.3,
				ease: "power3.out",
				scrollTrigger: {
					trigger: wrap,
					start: "top 80%",
					id: "rightSwipeWrap-" + i,
					toggleActions: "play none none none",
					// markers: true,
				},
			});
		});

		// left swipe
		document.querySelectorAll(".leftSwipeWrap").forEach((wrap, i) => {
			gsap.set(wrap.querySelectorAll(".left-swipe"), {
				transformPerspective: 1200,
				x: "-10rem",
				rotateY: 20,
				opacity: 0,
				transformOrigin: "left center",
			});
			gsap.to(wrap.querySelectorAll(".left-swipe"), {
				transformPerspective: 1200,
				x: 0,
				rotateY: 0,
				opacity: 1,
				delay: 0.4,
				ease: "power3.out",
				scrollTrigger: {
					trigger: wrap,
					start: "top 80%",
					id: "leftSwipeWrap-" + i,
					toggleActions: "play none none none",
					// markers: true,
				},
			});
		});

		// Text Invert
		if ($(".tj-text-invert").length) {
			const split = new SplitText(".tj-text-invert", { type: "lines" });
			split.lines.forEach(target => {
				gsap.to(target, {
					backgroundPositionX: 0,
					ease: "none",
					scrollTrigger: {
						trigger: target,
						scrub: 1,
						start: "top 75%",
						end: "bottom center",
					},
				});
			});
		}

		// Text Highlight
		if ($(".title-highlight").length) {
			const highlightText = new SplitText(".title-highlight", {
				type: "lines",
				linesClass: "line",
			});

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: ".title-highlight",
					scrub: 1,
					start: "top 80%",
					end: "bottom center",
				},
			});
			tl.to(".line", {
				"--highlight-offset": "100%",
				stagger: 0.4,
			});
		}

		// button move hover animation
		var hoverBtns = gsap.utils.toArray(".btn-hover-wrapper");

		const hoverBtnItem = gsap.utils.toArray(".btn-hover-inner");
		hoverBtns.forEach((btn, span) => {
			$(btn).on("mousemove", function (e) {
				callParallax(e);
			});

			function callParallax(e) {
				parallaxIt(e, hoverBtnItem[span], 50);
			}

			function parallaxIt(e, target, movement) {
				var $this = $(btn);
				var relX = e.pageX - $this.offset().left;
				var relY = e.pageY - $this.offset().top;

				gsap.to(target, 0.5, {
					x: ((relX - $this.width() / 2) / $this.width()) * movement,
					y: ((relY - $this.height() / 2) / $this.height()) * movement,
					ease: Power2.easeOut,
				});
			}
			$(btn).on("mouseleave", function (e) {
				gsap.to(hoverBtnItem[span], 0.5, {
					x: 0,
					y: 0,
					ease: Power2.easeOut,
				});
			});
		});

		// Images parallax
		gsap.utils.toArray(".img-parallax").forEach(container => {
			const img = container.querySelector("img");

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: container,
					scrub: 1,
					pin: false,
				},
			});

			tl.fromTo(
				img,
				{
					yPercent: 0,
					ease: "none",
				},
				{
					yPercent: -30,
					ease: "none",
				}
			);
		});
	}
})(jQuery);
