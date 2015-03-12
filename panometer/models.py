from django.db import models

class Meter(models.Model):
    title = models.CharField(max_length=100)
    customLongTitle = models.CharField(max_length=200,default='Average Happiness for Twitter')
    startDate = models.DateTimeField()
    endDate = models.DateTimeField()
    value = models.FloatField()
    lang = models.CharField(max_length=20)
    sumFile = models.CharField(max_length=100,default='sumhapps.csv',help_text='dont change this')
    ignoreWords = models.CharField(max_length=400, null=True, blank=True)

    def __unicode__(self):
        return self.title

    class Meta:
        ordering = ('title',)
