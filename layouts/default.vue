<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <template
                v-for="(crumb, index) in breadcrumbs"
                :key="index"
              >
                <BreadcrumbItem :class="{ 'hidden md:block': index === 0 }">
                  <BreadcrumbLink
                    v-if="crumb.path && index < breadcrumbs.length - 1"
                    :href="crumb.path"
                  >
                    {{ crumb.label }}
                  </BreadcrumbLink>
                  <BreadcrumbPage v-else-if="crumb.path">
                    {{ crumb.label }}
                  </BreadcrumbPage>
                  <span
                    v-else
                    class="text-muted-foreground"
                  >
                    {{ crumb.label }}
                  </span>
                </BreadcrumbItem>
                <BreadcrumbSeparator
                  v-if="index < breadcrumbs.length - 1"
                  :class="{ 'hidden md:block': index === 0 }"
                />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import AppSidebar from "@/components/AppSidebar.vue";

const route = useRoute();
const router = useRouter();

const breadcrumbs = computed(() => {
  const segments = route.path.split("/").filter(Boolean);
  const crumbs = [];

  // Add root breadcrumb if defined
  const rootRoute = router.resolve("/");
  if (rootRoute.meta?.breadcrumb) {
    const breadcrumb = rootRoute.meta.breadcrumb;
    crumbs.push({
      label: typeof breadcrumb === "string" ? breadcrumb : breadcrumb.label,
      path: "/",
    });
  }

  // Build breadcrumbs for each path segment
  let currentPath = "";
  let hasSkipped = false;

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const resolvedRoute = router.resolve(currentPath);

    if (resolvedRoute.meta?.breadcrumb) {
      // Add "..." placeholder if we skipped previous segments
      if (hasSkipped) {
        crumbs.push({
          label: "...",
          path: null,
        });
        hasSkipped = false;
      }

      const breadcrumb = resolvedRoute.meta.breadcrumb;
      crumbs.push({
        label: typeof breadcrumb === "string" ? breadcrumb : breadcrumb.label,
        path: currentPath,
      });
    } else {
      hasSkipped = true;
    }
  });

  return crumbs;
});
</script>
