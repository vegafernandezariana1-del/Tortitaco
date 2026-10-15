'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ProductExperience({ products }) {
  const root = useRef(null);
  const closeButton = useRef(null);
  const previousFocus = useRef(null);
  const [selected, setSelected] = useState(null);

  const openProduct = product => {
    previousFocus.current = document.activeElement;
    setSelected(product);
  };
  const closeProduct = () => {
    setSelected(null);
    requestAnimationFrame(() => previousFocus.current?.focus?.());
  };

  useEffect(() => {
    if (!selected) return;
    closeButton.current?.focus();
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = event => {
      if (event.key === 'Escape') closeProduct();
      if (event.key === 'Tab') {
        const focusable = Array.from(document.querySelectorAll('.product-dialog button:not([disabled]), .product-dialog a[href]'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = priorOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selected]);

  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const scenes = gsap.utils.toArray('.flavor-scene');
    const bags = gsap.utils.toArray('.scene-bag');
    const titleBits = gsap.utils.toArray('.scene-copy');
    gsap.set(bags.slice(1), { autoAlpha: 0, scale: 0.78, rotation: -8 });
    gsap.set(titleBits.slice(1), { autoAlpha: 0, y: 24 });

    let activeIndex = 0;
    const master = gsap.timeline({
      scrollTrigger: {
        trigger: '.showcase', start: 'top top', end: 'bottom bottom', scrub: 0.8,
        pin: '.showcase-stage', anticipatePin: 1,
        onUpdate: self => {
          const nextIndex = Math.min(products.length - 1, Math.floor(self.progress * products.length));
          if (nextIndex !== activeIndex) {
            activeIndex = nextIndex;
            gsap.utils.toArray('.stage-index span').forEach((item, index) => item.classList.toggle('current', index === activeIndex));
            document.querySelector('.stage-index')?.setAttribute('aria-label', `Sabor ${activeIndex + 1} de ${products.length}`);
            document.querySelector('.stage-counter span:first-child')?.replaceChildren(`${String(activeIndex + 1).padStart(2, '0')} — 0${products.length}`);
          }
        },
      },
    });

    scenes.forEach((_, index) => {
      const start = index;
      if (index > 0) {
        master.to(bags[index - 1], { autoAlpha: 0, scale: 0.78, rotation: 9, duration: 0.35 }, start)
          .to(titleBits[index - 1], { autoAlpha: 0, y: -18, duration: 0.25 }, start)
          .to(bags[index], { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.55 }, start + 0.12)
          .to(titleBits[index], { autoAlpha: 1, y: 0, duration: 0.35 }, start + 0.2);
      }
      master.to('.showcase-stage', { '--scene-color': products[index].color, duration: 0.55 }, start);
      // The package travels a shallow ellipse while the scroll timeline advances.
      master.to(bags[index], {
        keyframes: [
          { x: 0, y: 0, scale: 1, rotation: -2, duration: 0.18 },
          { x: 52, y: -24, scale: 0.94, rotation: 2, duration: 0.2 },
          { x: 4, y: -44, scale: 0.88, rotation: 0, duration: 0.2 },
          { x: -48, y: -20, scale: 0.94, rotation: -2, duration: 0.2 },
          { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.2 },
        ], ease: 'sine.inOut',
      }, start + 0.3);
    });

    gsap.to('.floating-chip', { y: -24, rotation: 14, duration: 2.6, yoyo: true, repeat: -1, stagger: 0.3, ease: 'sine.inOut' });
    gsap.fromTo('.hero-mark', { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' });
  }, { scope: root, dependencies: [products] });

  return <main ref={root}>
    <header className="topbar"><a className="brand" href="#inicio" aria-label="Tortitacos, inicio"><span className="brand-icon">〰</span><span>TORTITACOS<small>EL ANTOJO CRUJE</small></span></a><a className="nav-link" href="#sabores">NUESTROS SABORES <span>↘</span></a></header>

    <section id="inicio" className="hero">
      <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
      <div className="hero-mark"><span className="eyebrow">UN CRUNCH PARA CADA ANTOJO</span><h1>EL ANTOJO<br/><em>CRUJE</em> AQUÍ.</h1><p>Cuatro sabores. Un solo plan: compartir.</p><a className="pill-button" href="#sabores">DESCUBRE LOS SABORES <span>↓</span></a></div>
      <div className="hero-product"><span className="floating-chip chip-a" aria-hidden="true">✦</span><span className="floating-chip chip-b" aria-hidden="true">✳</span><span className="floating-chip chip-c" aria-hidden="true">✦</span><Image src={products[0].image} alt="Bolsa Tortitacos sabor queso" width={420} height={420} priority /></div>
      <div className="hero-side-note">HECHOS PARA<br/>ROMPER LA RUTINA</div><div className="scroll-hint"><span/> DESLIZA PARA EXPLORAR</div>
    </section>

    <section id="sabores" className="showcase" aria-label="Presentación de los cuatro sabores">
      <div className="showcase-stage" style={{ '--scene-color': products[0].color }}>
        <div className="stage-grain"/><div className="stage-orb"/>
        <div className="stage-counter"><span>01 — 04</span><span>ELIGE TU CRUNCH</span></div>
        <div className="stage-product">
          {products.map((product, i) => <button type="button" className="scene-bag" key={product.id} onClick={() => openProduct(product)} aria-label={`Ver detalles de ${product.name}`}><Image src={product.image} alt={`Empaque Tortitacos ${product.name}`} width={430} height={430} loading="eager" priority={i < 2} /></button>)}
        </div>
        <div className="stage-copy">
          {products.map((product) => <div className="scene-copy" key={product.id}><span className="scene-kicker">{product.kicker}</span><h2>{product.name}</h2><p>{product.description}</p><button type="button" className="text-link" onClick={() => openProduct(product)}>QUIERO PROBARLO <span>↗</span></button></div>)}
        </div>
        <div className="stage-index" aria-label="Sabor 1 de 4">{products.map((product, i) => <span key={product.id} className={i === 0 ? 'current' : ''}>{String(i + 1).padStart(2, '0')}</span>)}</div>
        <span className="stage-label">TORTITACOS · SABORES</span>
      </div>
      <div className="scene-track" aria-hidden="true">{products.map(p => <div className="flavor-scene" key={p.id}/>)}</div>
    </section>

    <section id="todos-los-sabores" className="finale">
      <div className="finale-top"><span className="eyebrow">NO TE QUEDES CON UNO</span><span className="finale-count">01 / 04 — 04 / 04</span></div>
      <h2>CONOCE TODOS<br/>NUESTROS <em>SABORES</em></h2>
      <div className="product-row">{products.map((product, i) => <button type="button" className="product-card" onClick={() => openProduct(product)} key={product.id} style={{ '--card-color': product.color }} aria-label={`Ver detalles de ${product.name}`}><span className="card-number">0{i + 1}</span><Image src={product.image} alt={`Empaque Tortitacos ${product.name}`} width={250} height={250} /><span className="card-name">{product.name}</span><span className="card-arrow" aria-hidden="true">↗</span></button>)}</div>
      <a className="pill-button dark-button" href="#sabores">VOLVER A VER <span>↑</span></a>
    </section>

    <section className="about" aria-labelledby="about-title">
      <div className="about-ornament" aria-hidden="true">T</div>
      <div className="about-copy"><span className="eyebrow">HECHOS EN COCHABAMBA, BOLIVIA</span><h2 id="about-title">SABOR QUE<br/>NACE DE <em>CASA.</em></h2><p><strong>Tortitacos</strong> es una reconocida marca y empresa boliviana, originaria de Cochabamba, dedicada a la fabricación de nachos, tortillas de maíz y tortillas de trigo desde hace más de 20 años.</p></div>
      <div className="about-stamp"><strong>20+</strong><span>AÑOS<br/>DE TRAYECTORIA</span><i aria-hidden="true">✳</i></div>
    </section>

    <section className="contact" aria-labelledby="contact-title"><div><span className="eyebrow">HABLEMOS</span><h2 id="contact-title">¿ANTOJO<br/>DE <em>TORTITACOS?</em></h2></div><div className="contact-links"><a href="tel:+59177434777">TELÉFONO <span>+591 77434777 ↗</span></a><a href="https://wa.me/59177434777" target="_blank" rel="noreferrer">WHATSAPP <span>ESCRÍBENOS ↗</span></a><a href="mailto:tortitacos@gmail.com">CORREO <span>tortitacos@gmail.com ↗</span></a></div></section>

    <footer className="footer"><a className="brand" href="#inicio"><span className="brand-icon">〰</span><span>TORTITACOS<small>EL ANTOJO CRUJE</small></span></a><div className="footer-products">{products.map(p => <button key={p.id} type="button" onClick={() => openProduct(p)} aria-label={`Ver ${p.name}`}>{p.name}</button>)}</div><span>HECHOS PARA COMPARTIR. © 2026 TORTITACOS</span><a href="#inicio">VOLVER ARRIBA ↑</a></footer>

    {selected && <div className="product-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeProduct(); }}><section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description"><button ref={closeButton} className="modal-close" type="button" onClick={closeProduct} aria-label="Cerrar ficha">×</button><div className="modal-image" style={{ '--card-color': selected.color }}><Image src={selected.image} alt={`Empaque Tortitacos ${selected.name}`} width={430} height={430} priority /></div><div className="modal-copy"><span className="eyebrow">{selected.kicker}</span><h2 id="dialog-title">{selected.name}</h2><p id="dialog-description">{selected.description}</p><button type="button" className="pill-button dark-button" onClick={closeProduct}>VOLVER A LOS SABORES <span>↗</span></button></div></section></div>}
  </main>;
}
