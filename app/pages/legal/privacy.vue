<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <!-- Header -->
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <NuxtLink to="/auth/login" class="flex items-center gap-2.5">
          <img src="~/assets/Focus.png" alt="FocusFlow" class="w-8 h-8 rounded-lg" />
          <span class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">FocusFlow</span>
        </NuxtLink>
        <NuxtLink to="/legal/terms" class="text-sm text-focusflow-600 hover:text-focusflow-500 dark:text-focusflow-400 font-medium transition-colors">
          {{ isEn ? 'Terms & Conditions' : 'Terminos y Condiciones' }}
        </NuxtLink>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-6 py-12">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {{ isEn ? 'Privacy Policy' : 'Politica de Privacidad' }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-10">
        {{ isEn ? 'Last updated: March 11, 2026' : 'Ultima actualizacion: 11 de marzo de 2026' }}
      </p>

      <div class="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed">
        <!-- 1 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '1. Data Controller' : '1. Responsable del Tratamiento' }}
          </h2>
          <p>
            <strong>Nexaru Live S.A.S</strong><br>
            {{ isEn ? 'Medellin, Colombia' : 'Medellin, Colombia' }}<br>
            {{ isEn ? 'Product: FocusFlow' : 'Producto: FocusFlow' }}
          </p>
          <p>
            {{ isEn
              ? 'Nexaru Live S.A.S ("we", "us", "our") is the entity responsible for the processing of your personal data in connection with the FocusFlow platform.'
              : 'Nexaru Live S.A.S ("nosotros", "nos", "nuestro") es la entidad responsable del tratamiento de sus datos personales en relacion con la plataforma FocusFlow.'
            }}
          </p>
        </section>

        <!-- 2 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '2. Information We Collect' : '2. Informacion que Recopilamos' }}
          </h2>
          <h3 class="text-base font-medium text-gray-800 dark:text-gray-200">
            {{ isEn ? '2.1 Information you provide' : '2.1 Informacion que usted proporciona' }}
          </h3>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'Account data: email address, name, profile picture' : 'Datos de cuenta: direccion de correo electronico, nombre, foto de perfil' }}</li>
            <li>{{ isEn ? 'Workspace and project data: names, descriptions, tasks, comments' : 'Datos de workspace y proyectos: nombres, descripciones, tareas, comentarios' }}</li>
            <li>{{ isEn ? 'Communication preferences and language settings' : 'Preferencias de comunicacion y configuracion de idioma' }}</li>
          </ul>

          <h3 class="text-base font-medium text-gray-800 dark:text-gray-200 mt-4">
            {{ isEn ? '2.2 Automatically collected information' : '2.2 Informacion recopilada automaticamente' }}
          </h3>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'Device and browser information' : 'Informacion del dispositivo y navegador' }}</li>
            <li>{{ isEn ? 'IP address and approximate location' : 'Direccion IP y ubicacion aproximada' }}</li>
            <li>{{ isEn ? 'Usage data: pages visited, features used, timestamps' : 'Datos de uso: paginas visitadas, funciones utilizadas, marcas de tiempo' }}</li>
            <li>{{ isEn ? 'Cookies and similar technologies' : 'Cookies y tecnologias similares' }}</li>
          </ul>

          <h3 class="text-base font-medium text-gray-800 dark:text-gray-200 mt-4">
            {{ isEn ? '2.3 Third-party authentication' : '2.3 Autenticacion de terceros' }}
          </h3>
          <p>
            {{ isEn
              ? 'If you sign in via Google OAuth or Web3 wallet, we receive your public profile information and wallet address respectively. We do not access your private keys or passwords from third-party providers.'
              : 'Si inicia sesion mediante Google OAuth o billetera Web3, recibimos su informacion de perfil publico y direccion de billetera respectivamente. No accedemos a sus claves privadas ni contrasenas de proveedores externos.'
            }}
          </p>
        </section>

        <!-- 3 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '3. How We Use Your Information' : '3. Como Usamos su Informacion' }}
          </h2>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'Provide, maintain, and improve FocusFlow services' : 'Proveer, mantener y mejorar los servicios de FocusFlow' }}</li>
            <li>{{ isEn ? 'Manage your account, workspaces, and team memberships' : 'Gestionar su cuenta, workspaces y membresías de equipo' }}</li>
            <li>{{ isEn ? 'Process AI-assisted features (task analysis, suggestions, document generation)' : 'Procesar funciones asistidas por IA (analisis de tareas, sugerencias, generacion de documentos)' }}</li>
            <li>{{ isEn ? 'Send transactional emails (invitations, notifications)' : 'Enviar correos transaccionales (invitaciones, notificaciones)' }}</li>
            <li>{{ isEn ? 'Push notifications (if you opt in via Firebase)' : 'Notificaciones push (si opta por recibirlas via Firebase)' }}</li>
            <li>{{ isEn ? 'Comply with legal obligations under Colombian law' : 'Cumplir con obligaciones legales bajo la legislacion colombiana' }}</li>
          </ul>
        </section>

        <!-- 4 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '4. AI Data Processing' : '4. Procesamiento de Datos con IA' }}
          </h2>
          <p>
            {{ isEn
              ? 'FocusFlow uses AI services (via OpenRouter) to provide task assistance, content generation, and analysis. When you use AI features:'
              : 'FocusFlow utiliza servicios de IA (via OpenRouter) para proporcionar asistencia en tareas, generacion de contenido y analisis. Cuando utiliza funciones de IA:'
            }}
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'Your task content and context may be sent to third-party AI providers' : 'El contenido y contexto de sus tareas puede ser enviado a proveedores de IA de terceros' }}</li>
            <li>{{ isEn ? 'AI token usage is tracked per workspace for billing and quota purposes' : 'El uso de tokens de IA se rastrea por workspace para fines de facturacion y cuotas' }}</li>
            <li>{{ isEn ? 'We do not use your data to train AI models' : 'No utilizamos sus datos para entrenar modelos de IA' }}</li>
          </ul>
        </section>

        <!-- 5 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '5. Data Sharing and Third Parties' : '5. Comparticion de Datos y Terceros' }}
          </h2>
          <p>{{ isEn ? 'We share data with the following service providers:' : 'Compartimos datos con los siguientes proveedores de servicio:' }}</p>
          <ul class="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — {{ isEn ? 'Database and authentication infrastructure' : 'Infraestructura de base de datos y autenticacion' }}</li>
            <li><strong>Amazon SES</strong> — {{ isEn ? 'Transactional email delivery' : 'Envio de correos transaccionales' }}</li>
            <li><strong>Firebase (Google)</strong> — {{ isEn ? 'Push notifications' : 'Notificaciones push' }}</li>
            <li><strong>OpenRouter</strong> — {{ isEn ? 'AI processing services' : 'Servicios de procesamiento de IA' }}</li>
            <li><strong>Google Meet API</strong> — {{ isEn ? 'Video meeting integration' : 'Integracion de videollamadas' }}</li>
          </ul>
          <p>
            {{ isEn
              ? 'We do not sell your personal data to third parties.'
              : 'No vendemos sus datos personales a terceros.'
            }}
          </p>
        </section>

        <!-- 6 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '6. Data Retention' : '6. Retencion de Datos' }}
          </h2>
          <p>
            {{ isEn
              ? 'We retain your personal data for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your data within 30 days, except where retention is required by law.'
              : 'Conservamos sus datos personales mientras su cuenta este activa o sea necesario para proporcionar servicios. Si elimina su cuenta, eliminaremos o anonimizaremos sus datos dentro de 30 dias, excepto cuando la retencion sea requerida por ley.'
            }}
          </p>
        </section>

        <!-- 7 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '7. Your Rights' : '7. Sus Derechos' }}
          </h2>
          <p>
            {{ isEn
              ? 'Under Colombian Law 1581 of 2012 (Habeas Data) and applicable regulations, you have the right to:'
              : 'Bajo la Ley 1581 de 2012 (Habeas Data) y las regulaciones aplicables, usted tiene derecho a:'
            }}
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'Access your personal data' : 'Acceder a sus datos personales' }}</li>
            <li>{{ isEn ? 'Rectify inaccurate or incomplete data' : 'Rectificar datos inexactos o incompletos' }}</li>
            <li>{{ isEn ? 'Request deletion of your data' : 'Solicitar la eliminacion de sus datos' }}</li>
            <li>{{ isEn ? 'Revoke your consent for data processing' : 'Revocar su consentimiento para el tratamiento de datos' }}</li>
            <li>{{ isEn ? 'File complaints with the Superintendencia de Industria y Comercio (SIC)' : 'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)' }}</li>
          </ul>
        </section>

        <!-- 8 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '8. Security' : '8. Seguridad' }}
          </h2>
          <p>
            {{ isEn
              ? 'We implement industry-standard security measures including encryption in transit (TLS), secure authentication via Supabase, role-based access control (RBAC), and regular security reviews.'
              : 'Implementamos medidas de seguridad estandar de la industria incluyendo cifrado en transito (TLS), autenticacion segura via Supabase, control de acceso basado en roles (RBAC) y revisiones de seguridad periodicas.'
            }}
          </p>
        </section>

        <!-- 9 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '9. Cookies' : '9. Cookies' }}
          </h2>
          <p>
            {{ isEn
              ? 'FocusFlow uses essential cookies for authentication and session management. We also use localStorage to persist your language preference. We do not use advertising or tracking cookies.'
              : 'FocusFlow utiliza cookies esenciales para autenticacion y gestion de sesiones. Tambien usamos localStorage para persistir su preferencia de idioma. No utilizamos cookies de publicidad ni rastreo.'
            }}
          </p>
        </section>

        <!-- 10 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '10. Changes to This Policy' : '10. Cambios a Esta Politica' }}
          </h2>
          <p>
            {{ isEn
              ? 'We may update this privacy policy from time to time. We will notify registered users of material changes via email or in-app notification.'
              : 'Podemos actualizar esta politica de privacidad periodicamente. Notificaremos a los usuarios registrados sobre cambios materiales por correo electronico o notificacion en la aplicacion.'
            }}
          </p>
        </section>

        <!-- 11 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '11. Contact' : '11. Contacto' }}
          </h2>
          <p>
            {{ isEn
              ? 'For questions about this policy or to exercise your data rights, contact us at:'
              : 'Para preguntas sobre esta politica o para ejercer sus derechos sobre sus datos, contactenos en:'
            }}
          </p>
          <p>
            <strong>Nexaru Live S.A.S</strong><br>
            {{ isEn ? 'Medellin, Colombia' : 'Medellin, Colombia' }}<br>
            {{ isEn ? 'Email: privacy@nexarulive.com' : 'Correo: privacy@nexarulive.com' }}
          </p>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
      <div class="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
        <span>&copy; 2026 Nexaru Live S.A.S. {{ isEn ? 'All rights reserved.' : 'Todos los derechos reservados.' }}</span>
        <div class="flex gap-4">
          <NuxtLink to="/legal/privacy" class="text-focusflow-600 dark:text-focusflow-400 font-medium">
            {{ isEn ? 'Privacy Policy' : 'Politica de Privacidad' }}
          </NuxtLink>
          <NuxtLink to="/legal/terms" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {{ isEn ? 'Terms & Conditions' : 'Terminos y Condiciones' }}
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const lang = useLanguage()
const isEn = computed(() => lang.language.value === 'en')

useHead({
  title: isEn.value ? 'Privacy Policy - FocusFlow' : 'Politica de Privacidad - FocusFlow',
})
</script>
