<template>
  <div class="min-h-screen flex relative bg-white dark:bg-gray-950">
    <!-- Left panel — branding -->
    <div class="hidden lg:flex lg:w-[480px] relative bg-focusflow-700 dark:bg-focusflow-900 items-center justify-center p-12">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
      <div class="relative z-10 max-w-sm">
        <div class="flex items-center gap-3 mb-12 animate-fade-up">
          <img src="/logo.png" alt="FocusFlow" class="w-10 h-10 rounded-xl" />
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
    <div class="flex-1 flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-3 mb-10 justify-center animate-fade-up">
          <img src="/logo.png" alt="FocusFlow" class="w-10 h-10 rounded-xl" />
          <span class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FocusFlow</span>
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>
