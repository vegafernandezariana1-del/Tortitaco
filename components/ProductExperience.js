'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
gsap.registerPlugin(useGSAP);

export default function ProductExperience({ products }) {
  const root = useRef(null);
  const closeButton = useRef(null);
  const previousFocus = useRef(null);
  const [selected, setSelected] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [packageSize, setPackageSize] = useState(200);
  const [quantity, setQuantity] = useState(1);
  const [cartReady, setCartReady] = useState(false);

  const advanceFlavor = () => setActiveIndex(index => (index + 1) % products.length);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('tortitacos-cart-v3');
      if (saved) {
        const savedItems = JSON.parse(saved);
        if (Array.isArray(savedItems)) setCart(savedItems.map(item => item.size === 360
          ? { ...item, size: 1000, key: `${item.productId}-1000` }
          : item));
      }
    } catch { /* Ignore invalid or unavailable local storage. */ }
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (cartReady) window.localStorage.setItem('tortitacos-cart-v3', JSON.stringify(cart));
  }, [cart, cartReady]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKeyDown = event => { if (event.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cartOpen]);

  const addToCart = () => {
    if (!selected) return;
    setCart(items => {
      const key = `${selected.id}-${packageSize}`;
      const existing = items.find(item => item.key === key);
      return existing
        ? items.map(item => item.key === key ? { ...item, quantity: item.quantity + quantity } : item)
        : [...items, { key, productId: selected.id, size: packageSize, quantity }];
    });
    closeProduct();
  };

  const changeCartQuantity = (key, amount) => setCart(items => items
    .map(item => item.key === key ? { ...item, quantity: item.quantity + amount } : item)
    .filter(item => item.quantity > 0));

  const cartLines = cart.map(item => {
    const product = products.find(entry => entry.id === item.productId);
    return { ...item, product, price: product?.prices?.[item.size] ?? null };
  }).filter(item => item.product);
  const cartTotal = cartLines.every(item => item.price !== null)
    ? cartLines.reduce((total, item) => total + item.price * item.quantity, 0)
    : null;
  const cartCount = cartLines.reduce((total, item) => total + item.quantity, 0);
  const money = amount => `Bs ${amount.toFixed(2)}`;
  const whatsappHref = `https://wa.me/59177434777?text=${encodeURIComponent(`Hola, quiero hacer este pedido:\n${cartLines.map(item => `${item.quantity} × ${item.product.name} ${item.size === 1000 ? '1 kg' : '200 g'}`).join('\n')}\nTotal: ${cartTotal === null ? 'por confirmar' : money(cartTotal)}`)}`;

  const openProduct = product => {
    previousFocus.current = document.activeElement;
    setPackageSize(200);
    setQuantity(1);
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
    gsap.to('.floating-chip', { y: -24, rotation: 14, duration: 2.6, yoyo: true, repeat: -1, stagger: 0.3, ease: 'sine.inOut' });
    gsap.fromTo('.hero-mark', { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' });
  }, { scope: root, dependencies: [products] });

  useEffect(() => {
    const stage = root.current?.querySelector('.showcase-stage');
    if (!stage) return;
    stage.style.setProperty('--scene-color', products[activeIndex].color);
    const activeItems = stage.querySelectorAll('.is-active');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(activeItems, { y: 14, scale: 0.97 }, { y: 0, scale: 1, duration: 0.42, stagger: 0.04, ease: 'power2.out', overwrite: true });
  }, [activeIndex, products]);

  return <main ref={root}>
    <header className="topbar"><a className="brand" href="#inicio" aria-label="Tortitacos, inicio"><span className="brand-icon">〰</span><span>TORTITACOS<small>EL ANTOJO CRUJE</small></span></a><div className="header-actions"><button type="button" className="cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${cartCount} productos`}><span>CARRITO</span><span className="cart-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 9H6M9 21h.01M18 21h.01"/></svg></span><b>{cartCount}</b></button></div></header>
    {cartCount > 0 && <button type="button" className="checkout-sticky" onClick={() => setCartOpen(true)} aria-label={`Completar pedido de ${cartCount} productos, total ${money(cartTotal ?? 0)}`}><span className="checkout-sticky-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 9H6M9 21h.01M18 21h.01"/></svg></span><span>COMPLETAR PEDIDO</span><b>{money(cartTotal ?? 0)}</b><span className="checkout-sticky-count">{cartCount}</span></button>}

    <section id="inicio" className="hero">
      <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
      <div className="hero-mark"><span className="eyebrow">UN CRUNCH PARA CADA ANTOJO</span><h1><span>EL ANTOJO</span><br/><em>CRUJE</em> <span>AQUÍ.</span></h1><p>Cuatro sabores. Un solo plan: compartir.</p><a className="pill-button" href="#sabores">DESCUBRE LOS SABORES <span className="ui-arrow down" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M10 3v14M4 11l6 6 6-6"/></svg></span></a></div>
      <div className="hero-collage"><Image src="/images/portada-horizontal.jpg" alt="Composición de varios empaques Tortitacos de distintos sabores" fill priority sizes="(max-width: 800px) 100vw, 58vw" /></div>
      <div className="hero-side-note">HECHOS PARA<br/>ROMPER LA RUTINA</div>
    </section>

    <section id="sabores" className="showcase" aria-label="Presentación de los cuatro sabores">
      <div className="showcase-stage" style={{ '--scene-color': products[activeIndex].color }}>
        <div className="stage-grain"/><div className="stage-orb"/>
        <div className="stage-counter"><span className="stage-instruction">TOCA LA BOLSA PARA CAMBIAR</span></div>
        <div className="stage-product">
          {products.map((product, i) => <button type="button" className={`scene-bag${i === activeIndex ? ' is-active' : ''}`} key={product.id} onClick={advanceFlavor} aria-label={`Siguiente sabor después de ${product.name}`} aria-live="polite"><Image src={product.image} alt={`Empaque Tortitacos ${product.name}`} width={430} height={430} loading="eager" priority={i < 2} /></button>)}
        </div>
        <div className="stage-copy">
          {products.map((product, i) => <div className={`scene-copy${i === activeIndex ? ' is-active' : ''}`} key={product.id} aria-hidden={i !== activeIndex}><span className="scene-kicker">{product.kicker}</span><h2>{product.name}</h2><p>{product.description}</p><button type="button" className="text-link" onClick={() => openProduct(product)}>QUIERO PROBARLO <span className="ui-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 15 15 5M6 5h9v9"/></svg></span></button></div>)}
        </div>
        <div className="stage-index" aria-label={`Sabor ${activeIndex + 1} de ${products.length}`}>{products.map((product, i) => <span key={product.id} className={i === activeIndex ? 'current' : ''}>{String(i + 1).padStart(2, '0')}</span>)}</div>
        <span className="stage-label">TORTITACOS · SABORES</span>
      </div>
    </section>

    <section id="todos-los-sabores" className="finale">
      <div className="finale-top"><span className="eyebrow">NO TE QUEDES CON UNO</span></div>
      <h2>CONOCE TODOS<br/>NUESTROS <em>SABORES</em></h2>
      <div className="product-row">{products.map(product => <button type="button" className="product-card" onClick={() => openProduct(product)} key={product.id} style={{ '--card-color': product.color }} aria-label={`Ver detalles de ${product.name}`}><Image src={product.image} alt={`Empaque Tortitacos ${product.name}`} width={250} height={250} /><span className="card-name">{product.name}</span><span className="card-arrow" aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false"><path d="M5 15 15 5M6 5h9v9"/></svg></span></button>)}</div>
      <button type="button" className="pill-button dark-button" onClick={() => setCartOpen(true)}>COMPLETAR PEDIDO <span className="ui-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 15 15 5M6 5h9v9"/></svg></span></button>
    </section>

    <section className="about" aria-labelledby="about-title">
      <div className="about-ornament" aria-hidden="true">T</div>
      <div className="about-copy"><span className="eyebrow">HECHOS EN COCHABAMBA, BOLIVIA</span><h2 id="about-title">SABOR QUE<br/>NACE DE <em>CASA.</em></h2><p><strong>Tortitacos</strong> es una reconocida marca y empresa boliviana, originaria de Cochabamba, dedicada a la fabricación de nachos, tortillas de maíz y tortillas de trigo desde hace más de 20 años.</p></div>
      <div className="about-stamp"><strong>20+</strong><span>AÑOS<br/>DE TRAYECTORIA</span><i aria-hidden="true">✳</i></div>
    </section>

    <section className="contact" aria-labelledby="contact-title"><div><span className="eyebrow">HABLEMOS</span><h2 id="contact-title">¿ANTOJO<br/>DE <em>TORTITACOS?</em></h2></div><div className="contact-links"><a href="tel:+59177434777">TELÉFONO <span>+591 77434777 <i className="ui-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 15 15 5M6 5h9v9"/></svg></i></span></a><a href="https://wa.me/59177434777" target="_blank" rel="noreferrer">WHATSAPP <span>ESCRÍBENOS <i className="ui-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 15 15 5M6 5h9v9"/></svg></i></span></a><a href="mailto:tortitacos@gmail.com">CORREO <span>tortitacos@gmail.com <i className="ui-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 15 15 5M6 5h9v9"/></svg></i></span></a></div></section>

    <footer className="footer"><a className="brand" href="#inicio"><span className="brand-icon">〰</span><span>TORTITACOS<small>EL ANTOJO CRUJE</small></span></a><div className="footer-products">{products.map(p => <button key={p.id} type="button" onClick={() => openProduct(p)} aria-label={`Ver ${p.name}`}>{p.name}</button>)}</div><span>HECHOS PARA COMPARTIR. © 2026 TORTITACOS</span><a href="#inicio">VOLVER ARRIBA <i className="ui-arrow up" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M10 17V3M4 9l6-6 6 6"/></svg></i></a></footer>

    {selected && <div className="product-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeProduct(); }}><section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description"><button ref={closeButton} className="modal-close" type="button" onClick={closeProduct} aria-label="Cerrar ficha">×</button><div className="modal-image" style={{ '--card-color': selected.color }}><Image src={selected.image} alt={`Empaque Tortitacos ${selected.name}`} width={430} height={430} priority /></div><div className="modal-copy"><span className="eyebrow">{selected.kicker}</span><h2 id="dialog-title">{selected.name}</h2><p id="dialog-description">{selected.description}</p><label className="field-label" htmlFor="package-size">TAMAÑO</label><select id="package-size" value={packageSize} onChange={event => setPackageSize(Number(event.target.value))}><option value={200}>200 g {selected.prices?.[200] == null ? '· precio por confirmar' : `· ${money(selected.prices[200])}`}</option><option value={1000}>1 kg · {money(selected.prices?.[1000] ?? 0)}</option></select><label className="field-label" htmlFor="product-quantity">CANTIDAD</label><div className="quantity-picker"><button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label="Quitar una unidad">−</button><input id="product-quantity" type="number" min="1" max="99" value={quantity} onChange={event => setQuantity(Math.min(99, Math.max(1, Number(event.target.value) || 1)))} /><button type="button" onClick={() => setQuantity(value => Math.min(99, value + 1))} aria-label="Añadir una unidad">+</button></div><button type="button" className="pill-button dark-button add-cart-button" onClick={addToCart}>AÑADIR AL CARRITO <span>＋</span></button></div></section></div>}

    {cartOpen && <div className="cart-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="cart-heading"><div><span className="eyebrow">TU PEDIDO</span><h2 id="cart-title">Carrito <span>({cartCount})</span></h2></div><button type="button" className="cart-close" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">×</button></div>{cartLines.length === 0 ? <p className="cart-empty">Tu carrito está vacío. Elige un sabor para empezar.</p> : <><div className="cart-lines">{cartLines.map(item => <article className="cart-line" key={item.key}><Image src={item.product.image} alt="" width={80} height={80} /><div className="cart-line-info"><strong>{item.product.name}</strong><span>{item.size === 1000 ? '1 kg' : '200 g'} · {money(item.price)} c/u</span><div className="cart-line-controls"><button type="button" onClick={() => changeCartQuantity(item.key, -1)} aria-label={`Quitar una bolsa de ${item.product.name}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => changeCartQuantity(item.key, 1)} aria-label={`Añadir una bolsa de ${item.product.name}`}>+</button><button type="button" className="remove-line" onClick={() => setCart(lines => lines.filter(line => line.key !== item.key))}>Eliminar</button></div></div></article>)}</div><div className="cart-summary"><div className="cart-total"><span>Total</span><strong>{money(cartTotal)}</strong></div><a className="pill-button dark-button whatsapp-checkout" href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => setCartOpen(false)}>PEDIR POR WHATSAPP <span className="ui-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 15 15 5M6 5h9v9"/></svg></span></a></div></>}</aside></div>}
  </main>;
}
