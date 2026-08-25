<template>
  <div class="min-h-screen flex relative overflow-hidden bg-[#eef7f5] text-gray-900 dark:bg-[#050807] dark:text-white">
    <div class="ff-aurora-bg pointer-events-none fixed inset-0 z-0 opacity-95" />
    <!-- Left panel — branding -->
    <div class="ff-auth-brand hidden lg:flex lg:w-[480px] relative z-10 items-center justify-center p-12">
      <div class="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),transparent_38%),linear-gradient(300deg,rgba(255,255,255,0.08),transparent_46%)]" />
      <div class="relative z-10 max-w-sm">
        <div class="flex items-center gap-3 mb-12 animate-fade-up">
          <img src="/logo.png" alt="FocusFlow" class="w-10 h-10 rounded-lg ring-1 ring-white/25 shadow-lg shadow-black/15" />
          <span class="text-xl font-bold text-white tracking-tight">FocusFlow</span>
        </div>
        <h2 class="text-3xl font-bold text-white leading-tight mb-4 animate-fade-up delay-100">
          Gestiona proyectos<br/>
          <span class="text-focusflow-200">con claridad total.</span>
        </h2>
        <p class="text-focusflow-200/80 text-base leading-relaxed animate-fade-up delay-200">
          Kanban inteligente, asistente AI y herramientas anti-procrastinación para equipos que entregan resultados.
        </p>

        <div class="flex gap-2 mt-10 animate-fade-up delay-300 flex-wrap">
          <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/80">Kanban Board</span>
          <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/80">AI Assistant</span>
          <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/80">Anti-Procrastinación</span>
        </div>
      </div>
    </div>

    <!-- Right panel — form -->
    <div class="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
      <div class="ff-glass-panel ff-auth-card w-full max-w-[420px] p-5 sm:p-6">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-3 mb-10 justify-center animate-fade-up">
          <img src="/logo.png" alt="FocusFlow" class="w-10 h-10 rounded-lg shadow-sm shadow-focusflow-500/20" />
          <span class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FocusFlow</span>
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>
