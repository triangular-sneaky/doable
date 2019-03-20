AppRouter = {
  url(route, params ) {
    return FlowRouter.url(route, params, this.getStickyQueryParams());
  },
  go(route, params) {
    return FlowRouter.go(route, params, this.getStickyQueryParams());
  },
  getStickyQueryParams() {
    return { focus: FlowRouter.current().queryParams.focus} ;
  },

}
