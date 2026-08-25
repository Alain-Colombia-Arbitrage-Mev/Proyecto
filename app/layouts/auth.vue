<template>
  <div class="min-h-screen flex relative overflow-hidden bg-[#eef7f5] text-gray-900 dark:bg-[#050807] dark:text-white">
    <div class="ff-aurora-bg pointer-events-none fixed inset-0 z-0 opacity-95" />
    <div class="pointer-events-none fixed inset-x-0 top-0 z-0 h-28 bg-gradient-to-b from-white/35 to-transparent dark:from-white/[0.045]" />

    <div class="relative z-10 grid min-h-screen w-full lg:grid-cols-[minmax(420px,0.86fr)_minmax(420px,1fr)]">
      <!-- Left panel — branding -->
      <aside class="hidden lg:flex items-center justify-center px-8 py-10 xl:px-14">
        <div class="ff-auth-showcase w-full max-w-[460px] p-7 xl:p-8">
          <div class="flex items-center gap-3 animate-fade-up">
            <img src="/logo.png" alt="FocusFlow" class="h-11 w-11 rounded-lg ring-1 ring-white/25 shadow-lg shadow-black/20" />
            <div>
              <p class="text-lg font-bold leading-tight text-white">FocusFlow</p>
              <p class="text-xs font-medium text-white/48">Project OS</p>
            </div>
          </div>

          <div class="mt-12 animate-fade-up delay-100">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-focusflow-200/75">Centro de control</p>
            <h2 class="mt-3 text-[2.6rem] font-bold leading-[0.96] tracking-tight text-white" style="font-family: 'Space Grotesk', sans-serif;">
              Entra directo<br/>
              al trabajo claro.
            </h2>
            <p class="mt-5 max-w-sm text-sm leading-6 text-white/62">
              Tareas, prioridades, AI agents y foco diario en un espacio de trabajo ordenado.
            </p>
          </div>

          <div class="mt-10 grid gap-3 animate-fade-up delay-200">
            <div class="rounded-lg border border-white/10 bg-black/24 p-3.5 backdrop-blur-xl">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-white/72">Salud del sprint</span>
                <span class="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">82%</span>
              </div>
              <div class="mt-3 grid grid-cols-5 gap-1.5">
                <span class="h-1.5 rounded-full bg-emerald-300" />
                <span class="h-1.5 rounded-full bg-emerald-300" />
                <span class="h-1.5 rounded-full bg-emerald-300" />
                <span class="h-1.5 rounded-full bg-white/18" />
                <span class="h-1.5 rounded-full bg-white/12" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg border border-white/10 bg-white/[0.055] p-3 backdrop-blur-xl">
                <UIcon name="i-heroicons-bolt-solid" class="h-5 w-5 text-amber-300" />
                <p class="mt-4 text-[11px] font-semibold text-white/62">Hyperfocus</p>
              </div>
              <div class="rounded-lg border border-white/10 bg-white/[0.055] p-3 backdrop-blur-xl">
                <UIcon name="i-heroicons-cpu-chip" class="h-5 w-5 text-focusflow-200" />
                <p class="mt-4 text-[11px] font-semibold text-white/62">Asesor AI</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right panel — form -->
      <main class="flex items-center justify-center p-4 py-8 sm:p-6 lg:p-10">
        <div class="ff-glass-panel ff-auth-card w-full max-w-[460px] p-5 sm:p-7">
          <div class="mb-7 flex items-center justify-between gap-4 animate-fade-up">
            <div class="flex items-center gap-3">
              <img src="/logo.png" alt="FocusFlow" class="h-10 w-10 rounded-lg shadow-sm shadow-focusflow-500/20 ring-1 ring-white/45 dark:ring-white/10" />
              <div>
                <p class="text-base font-bold leading-tight text-gray-950 dark:text-white">FocusFlow</p>
                <p class="text-[11px] font-medium text-gray-500 dark:text-white/42">Acceso al workspace</p>
              </div>
            </div>
            <span class="hidden rounded-full border border-focusflow-200/70 bg-focusflow-50/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-focusflow-700 backdrop-blur-xl dark:border-focusflow-400/15 dark:bg-focusflow-400/10 dark:text-focusflow-200 sm:inline-flex">
              Seguro
            </span>
          </div>
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
