<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <!-- Header -->
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <NuxtLink to="/auth/login" class="flex items-center gap-2.5">
          <img src="~/assets/Focus.png" alt="FocusFlow" class="w-8 h-8 rounded-lg" />
          <span class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">FocusFlow</span>
        </NuxtLink>
        <NuxtLink to="/legal/privacy" class="text-sm text-focusflow-600 hover:text-focusflow-500 dark:text-focusflow-400 font-medium transition-colors">
          {{ isEn ? 'Privacy Policy' : 'Politica de Privacidad' }}
        </NuxtLink>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-6 py-12">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {{ isEn ? 'Terms and Conditions' : 'Terminos y Condiciones' }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-10">
        {{ isEn ? 'Last updated: March 11, 2026' : 'Ultima actualizacion: 11 de marzo de 2026' }}
      </p>

      <div class="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed">
        <!-- 1 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '1. General Information' : '1. Informacion General' }}
          </h2>
          <p>
            {{ isEn
              ? 'These Terms and Conditions ("Terms") govern the use of the FocusFlow platform ("the Platform"), operated by Nexaru Live S.A.S, a company incorporated under the laws of the Republic of Colombia, with its principal place of business in Medellin, Colombia.'
              : 'Estos Terminos y Condiciones ("Terminos") regulan el uso de la plataforma FocusFlow ("la Plataforma"), operada por Nexaru Live S.A.S, una sociedad constituida bajo las leyes de la Republica de Colombia, con domicilio principal en Medellin, Colombia.'
            }}
          </p>
          <p>
            {{ isEn
              ? 'By accessing or using FocusFlow, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.'
              : 'Al acceder o utilizar FocusFlow, usted acepta quedar vinculado por estos Terminos. Si no esta de acuerdo, por favor no utilice la Plataforma.'
            }}
          </p>
        </section>

        <!-- 2 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '2. Service Description' : '2. Descripcion del Servicio' }}
          </h2>
          <p>
            {{ isEn
              ? 'FocusFlow is a project management platform that provides workspace management, Kanban boards, task management, team collaboration, AI-assisted workflows, document generation, video meeting integration, and productivity tools.'
              : 'FocusFlow es una plataforma de gestion de proyectos que proporciona gestion de workspaces, tableros Kanban, gestion de tareas, colaboracion en equipo, flujos de trabajo asistidos por IA, generacion de documentos, integracion con videollamadas y herramientas de productividad.'
            }}
          </p>
        </section>

        <!-- 3 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '3. User Accounts' : '3. Cuentas de Usuario' }}
          </h2>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'You must provide a valid email address to create an account' : 'Debe proporcionar una direccion de correo electronico valida para crear una cuenta' }}</li>
            <li>{{ isEn ? 'You are responsible for maintaining the confidentiality of your credentials' : 'Usted es responsable de mantener la confidencialidad de sus credenciales' }}</li>
            <li>{{ isEn ? 'You must be at least 18 years old or have parental consent' : 'Debe tener al menos 18 anos o contar con consentimiento paternal' }}</li>
            <li>{{ isEn ? 'One person may not maintain more than one account' : 'Una persona no puede mantener mas de una cuenta' }}</li>
            <li>{{ isEn ? 'You must not share your account with third parties' : 'No debe compartir su cuenta con terceros' }}</li>
          </ul>
        </section>

        <!-- 4 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '4. Workspaces and Roles' : '4. Workspaces y Roles' }}
          </h2>
          <p>
            {{ isEn
              ? 'FocusFlow operates with a multi-workspace model. Each workspace has role-based access control with the following hierarchy: Owner, Admin, Member, Marketing, and Viewer. Workspace owners and administrators are responsible for managing member permissions and data within their workspace.'
              : 'FocusFlow opera con un modelo multi-workspace. Cada workspace tiene control de acceso basado en roles con la siguiente jerarquia: Propietario, Administrador, Miembro, Marketing y Visor. Los propietarios y administradores del workspace son responsables de gestionar los permisos de los miembros y los datos dentro de su workspace.'
            }}
          </p>
        </section>

        <!-- 5 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '5. Acceptable Use' : '5. Uso Aceptable' }}
          </h2>
          <p>{{ isEn ? 'You agree NOT to:' : 'Usted acepta NO:' }}</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'Use the Platform for any illegal purpose' : 'Usar la Plataforma para cualquier proposito ilegal' }}</li>
            <li>{{ isEn ? 'Upload malicious content, viruses, or harmful code' : 'Subir contenido malicioso, virus o codigo danino' }}</li>
            <li>{{ isEn ? 'Attempt to gain unauthorized access to other accounts or systems' : 'Intentar obtener acceso no autorizado a otras cuentas o sistemas' }}</li>
            <li>{{ isEn ? 'Abuse AI features by submitting harmful, illegal, or manipulative prompts' : 'Abusar de las funciones de IA enviando prompts daninos, ilegales o manipulativos' }}</li>
            <li>{{ isEn ? 'Reverse engineer, decompile, or disassemble the Platform' : 'Realizar ingenieria inversa, descompilar o desensamblar la Plataforma' }}</li>
            <li>{{ isEn ? 'Use automated systems to scrape or extract data from the Platform' : 'Usar sistemas automatizados para extraer datos de la Plataforma' }}</li>
            <li>{{ isEn ? 'Violate the intellectual property rights of Nexaru Live S.A.S or third parties' : 'Violar los derechos de propiedad intelectual de Nexaru Live S.A.S o terceros' }}</li>
          </ul>
        </section>

        <!-- 6 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '6. AI Features' : '6. Funciones de IA' }}
          </h2>
          <p>
            {{ isEn
              ? 'FocusFlow integrates AI-powered features including task analysis, content generation, and smart suggestions. By using these features:'
              : 'FocusFlow integra funciones impulsadas por IA que incluyen analisis de tareas, generacion de contenido y sugerencias inteligentes. Al utilizar estas funciones:'
            }}
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ isEn ? 'AI-generated content is provided "as is" without guarantees of accuracy' : 'El contenido generado por IA se proporciona "tal cual" sin garantias de precision' }}</li>
            <li>{{ isEn ? 'You are responsible for reviewing and validating AI outputs before use' : 'Usted es responsable de revisar y validar los resultados de IA antes de usarlos' }}</li>
            <li>{{ isEn ? 'AI usage is subject to token quotas per workspace' : 'El uso de IA esta sujeto a cuotas de tokens por workspace' }}</li>
            <li>{{ isEn ? 'Your data may be processed by third-party AI providers (see Privacy Policy)' : 'Sus datos pueden ser procesados por proveedores de IA de terceros (ver Politica de Privacidad)' }}</li>
          </ul>
        </section>

        <!-- 7 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '7. Intellectual Property' : '7. Propiedad Intelectual' }}
          </h2>
          <p>
            {{ isEn
              ? 'The FocusFlow platform, including its design, code, logos, and documentation, is the exclusive property of Nexaru Live S.A.S. You retain ownership of the content you create within the Platform (tasks, documents, comments). By using the Platform, you grant us a limited license to host and display your content as necessary to provide the service.'
              : 'La plataforma FocusFlow, incluyendo su diseno, codigo, logos y documentacion, es propiedad exclusiva de Nexaru Live S.A.S. Usted conserva la propiedad del contenido que crea dentro de la Plataforma (tareas, documentos, comentarios). Al utilizar la Plataforma, nos otorga una licencia limitada para alojar y mostrar su contenido segun sea necesario para proveer el servicio.'
            }}
          </p>
        </section>

        <!-- 8 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '8. Limitation of Liability' : '8. Limitacion de Responsabilidad' }}
          </h2>
          <p>
            {{ isEn
              ? 'To the maximum extent permitted by Colombian law, Nexaru Live S.A.S shall not be liable for indirect, incidental, special, or consequential damages arising from the use or inability to use the Platform. This includes but is not limited to loss of data, loss of profits, or business interruption.'
              : 'En la maxima medida permitida por la ley colombiana, Nexaru Live S.A.S no sera responsable por danos indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso de la Plataforma. Esto incluye, pero no se limita a, perdida de datos, perdida de ganancias o interrupcion del negocio.'
            }}
          </p>
        </section>

        <!-- 9 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '9. Service Availability' : '9. Disponibilidad del Servicio' }}
          </h2>
          <p>
            {{ isEn
              ? 'We strive to maintain high availability but do not guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue the Platform (or parts of it) with reasonable notice. Scheduled maintenance will be communicated in advance when possible.'
              : 'Nos esforzamos por mantener alta disponibilidad pero no garantizamos un servicio ininterrumpido. Nos reservamos el derecho de modificar, suspender o descontinuar la Plataforma (o partes de ella) con aviso razonable. El mantenimiento programado sera comunicado con anticipacion cuando sea posible.'
            }}
          </p>
        </section>

        <!-- 10 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '10. Account Termination' : '10. Terminacion de Cuenta' }}
          </h2>
          <p>
            {{ isEn
              ? 'We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time. Upon termination, your data will be handled according to our Privacy Policy.'
              : 'Nos reservamos el derecho de suspender o terminar cuentas que violen estos Terminos. Usted puede eliminar su cuenta en cualquier momento. Al terminarse, sus datos seran manejados de acuerdo con nuestra Politica de Privacidad.'
            }}
          </p>
        </section>

        <!-- 11 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '11. Governing Law and Jurisdiction' : '11. Ley Aplicable y Jurisdiccion' }}
          </h2>
          <p>
            {{ isEn
              ? 'These Terms are governed by the laws of the Republic of Colombia. Any disputes arising from the use of FocusFlow shall be resolved before the competent courts of Medellin, Colombia, unless the parties agree to alternative dispute resolution mechanisms.'
              : 'Estos Terminos se rigen por las leyes de la Republica de Colombia. Cualquier disputa derivada del uso de FocusFlow sera resuelta ante los tribunales competentes de Medellin, Colombia, a menos que las partes acuerden mecanismos alternativos de resolucion de conflictos.'
            }}
          </p>
        </section>

        <!-- 12 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '12. Changes to These Terms' : '12. Cambios a Estos Terminos' }}
          </h2>
          <p>
            {{ isEn
              ? 'We reserve the right to update these Terms at any time. Material changes will be notified to users via email or in-app notification at least 15 days before taking effect. Continued use of the Platform after changes constitutes acceptance of the new Terms.'
              : 'Nos reservamos el derecho de actualizar estos Terminos en cualquier momento. Los cambios materiales seran notificados a los usuarios por correo electronico o notificacion en la aplicacion con al menos 15 dias de anticipacion. El uso continuado de la Plataforma despues de los cambios constituye aceptacion de los nuevos Terminos.'
            }}
          </p>
        </section>

        <!-- 13 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEn ? '13. Contact' : '13. Contacto' }}
          </h2>
          <p>
            {{ isEn
              ? 'For questions or concerns about these Terms, contact us at:'
              : 'Para preguntas o inquietudes sobre estos Terminos, contactenos en:'
            }}
          </p>
          <p>
            <strong>Nexaru Live S.A.S</strong><br>
            {{ isEn ? 'Medellin, Colombia' : 'Medellin, Colombia' }}<br>
            {{ isEn ? 'Email: legal@nexarulive.com' : 'Correo: legal@nexarulive.com' }}
          </p>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
      <div class="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
        <span>&copy; 2026 Nexaru Live S.A.S. {{ isEn ? 'All rights reserved.' : 'Todos los derechos reservados.' }}</span>
        <div class="flex gap-4">
          <NuxtLink to="/legal/privacy" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {{ isEn ? 'Privacy Policy' : 'Politica de Privacidad' }}
          </NuxtLink>
          <NuxtLink to="/legal/terms" class="text-focusflow-600 dark:text-focusflow-400 font-medium">
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
  title: isEn.value ? 'Terms & Conditions - FocusFlow' : 'Terminos y Condiciones - FocusFlow',
})
</script>
