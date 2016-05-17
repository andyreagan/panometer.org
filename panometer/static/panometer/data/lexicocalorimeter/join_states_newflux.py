# coding: utf-8
f = open("flux.txt",)
f = open("flux.txt","r")
f.readline()
new_flux = [line.rstrip() for line in f]
len(new_flux)
f.close()
f = open("caloric_balance06292015.csv","r")
header = f.readline()
old_flux = [line.rstrip().split(',) for line in f]
old_flux = [line.rstrip().split(',') for line in f]
len(old_flux)
f.close()
f = open("flux-wstates.txt","w")
f.write(header)
print(header)
old_flux_wstates = ["{0},{1}".format(old_flux[i],new_flux[i][0]) for i range(len(old_flux))]
old_flux_wstates = ["{0},{1}".format(old_flux[i],new_flux[i][0]) for i in range(len(old_flux))]
old_flux_wstates
old_flux_wstates = ["{0},{1}".format(old_flux[i][0],new_flux[i]) for i in range(len(old_flux))]
old_flux_wstates
f.write("\n".join(old_flux_wstates))
f.close()
get_ipython().magic(u'save join_states_newflux 1-23')
