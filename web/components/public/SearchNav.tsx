"use client";

import { useEffect } from "react";
import { initSearchNav } from "@/lib/searchNav";
import type { CategoryWithProducts } from "@/lib/types";

export function SearchNav({ categories }: { categories: CategoryWithProducts[] }) {
  useEffect(() => {
    return initSearchNav();
  }, []);

  return (
    <>
      <div className="nav-wrap">
        <div className="search-row">
          <input
            type="search"
            id="search-input"
            className="search-input"
            placeholder="Buscar pão, focaccia, sabor..."
            aria-label="Buscar produtos"
          />
        </div>
        <nav className="nav" id="nav">
          {categories.map((category) => (
            <button key={category.id} className="nav-tab" data-target={category.slug}>
              {category.name}
            </button>
          ))}
        </nav>
      </div>
      <p id="search-empty" className="search-empty">
        Nenhum produto encontrado.
      </p>
    </>
  );
}
