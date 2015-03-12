# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Meter'
        db.create_table(u'panometer_meter', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('customLongTitle', self.gf('django.db.models.fields.CharField')(default='Average Happiness for Twitter', max_length=200)),
            ('startDate', self.gf('django.db.models.fields.DateTimeField')()),
            ('endDate', self.gf('django.db.models.fields.DateTimeField')()),
            ('value', self.gf('django.db.models.fields.FloatField')()),
            ('lang', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('sumFile', self.gf('django.db.models.fields.CharField')(default='sumhapps.csv', max_length=100)),
            ('ignoreWords', self.gf('django.db.models.fields.CharField')(max_length=400, null=True, blank=True)),
        ))
        db.send_create_signal(u'panometer', ['Meter'])


    def backwards(self, orm):
        # Deleting model 'Meter'
        db.delete_table(u'panometer_meter')


    models = {
        u'panometer.meter': {
            'Meta': {'ordering': "('title',)", 'object_name': 'Meter'},
            'customLongTitle': ('django.db.models.fields.CharField', [], {'default': "'Average Happiness for Twitter'", 'max_length': '200'}),
            'endDate': ('django.db.models.fields.DateTimeField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ignoreWords': ('django.db.models.fields.CharField', [], {'max_length': '400', 'null': 'True', 'blank': 'True'}),
            'lang': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'startDate': ('django.db.models.fields.DateTimeField', [], {}),
            'sumFile': ('django.db.models.fields.CharField', [], {'default': "'sumhapps.csv'", 'max_length': '100'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'value': ('django.db.models.fields.FloatField', [], {})
        }
    }

    complete_apps = ['panometer']